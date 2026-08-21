import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  CommitLatestResult,
  DeleteImportedDataResult,
  DisconnectResult,
  ImportedAcademicState,
  ISigaaRepository,
  LeaseGrant,
  RateLimitDecision,
  ReserveAttemptResult,
  SigaaRateLimitOperation,
  SigaaRunReceipt,
  SigaaSyncFailureCode,
} from "@/lib/server/db/interfaces/sigaa-repository.interface";
import { prisma } from "@/lib/server/db/prisma";
import {
  leaseSecretSchema,
  matriculaSchema,
  parseSigaaAcademicSnapshotPayload,
  parseSigaaSnapshotCandidate,
  sigaaMatriculaLockKey,
  sigaaRunIdSchema,
  toSigaaAcademicSnapshotPayload,
  type SigaaSnapshotCandidate,
  type UsuarioId,
} from "@/lib/server/services/sigaa/storage.types";

const LEASE_SECONDS = 240;
const RETENTION_SECONDS = 90 * 24 * 60 * 60;

const RATE_LIMIT_POLICIES = {
  REAUTH: { limit: 5, windowSeconds: 15 * 60 },
  SYNC: { limit: 3, windowSeconds: 15 * 60 },
  DISCONNECT: { limit: 5, windowSeconds: 60 * 60 },
  DELETE_IMPORTED_DATA: { limit: 3, windowSeconds: 24 * 60 * 60 },
} as const satisfies Record<SigaaRateLimitOperation, { limit: number; windowSeconds: number }>;

type Transaction = Prisma.TransactionClient;

type RunRow = {
  id: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "SUPERSEDED";
  failureCode: SigaaSyncFailureCode | null;
  connectorRequestId: string | null;
  iniciadoEm: Date;
  finalizadoEm: Date | null;
};

type DatabaseTimes = {
  now: Date;
  leaseExpiresAt: Date;
  retentionExpiresAt: Date;
};

const digest = (value: string): string => createHash("sha256").update(value).digest("hex");

const normalizeCourseIdentity = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

const courseIdentityToken = (cursoId: string, courseName: string): string =>
  digest(`${cursoId}\u0000${normalizeCourseIdentity(courseName)}`);

const secretsEqual = (first: string, second: string): boolean => {
  const firstBuffer = Buffer.from(first, "hex");
  const secondBuffer = Buffer.from(second, "hex");
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
};

const toRunReceipt = (run: RunRow): SigaaRunReceipt => ({
  id: sigaaRunIdSchema.parse(run.id),
  status: run.status,
  failureCode: run.failureCode,
  connectorRequestId: run.connectorRequestId,
  startedAt: run.iniciadoEm,
  finishedAt: run.finalizadoEm,
});

const isMatriculaUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.some(field => field === "matricula")
    : typeof target === "string" && target.includes("matricula");
};

export class PrismaSigaaRepository implements ISigaaRepository {
  constructor(
    private readonly database: PrismaClient = prisma,
    private readonly courseMatches: (profileCourse: string, sigaaCourse: string) => boolean = (
      profileCourse,
      sigaaCourse
    ) => normalizeCourseIdentity(profileCourse) === normalizeCourseIdentity(sigaaCourse)
  ) {}

  consumeRateLimit(input: {
    ownerId: UsuarioId;
    operation: SigaaRateLimitOperation;
  }): Promise<RateLimitDecision> {
    return this.database.$transaction(async transaction => {
      await this.lockRateLimit(transaction, input.ownerId, input.operation);
      return this.consumeRateLimitInTransaction(transaction, input.ownerId, input.operation);
    });
  }

  reserveAttempt(input: {
    ownerId: UsuarioId;
    idempotencyKey: string;
    consentVersion: string;
  }): Promise<ReserveAttemptResult> {
    return this.database.$transaction(async transaction => {
      await this.lockAggregate(transaction, input.ownerId);

      const existing = await transaction.sigaaSyncRun.findUnique({
        where: {
          usuarioId_idempotencyKey: {
            usuarioId: input.ownerId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });

      if (existing) {
        return { kind: "replay", run: toRunReceipt(existing) };
      }

      await this.lockRateLimit(transaction, input.ownerId, "SYNC");
      const limit = await this.consumeRateLimitInTransaction(transaction, input.ownerId, "SYNC");
      if (limit.kind === "rate_limited") {
        return limit;
      }

      await this.lockUsuario(transaction, input.ownerId);
      const owner = await transaction.usuario.findUnique({
        where: { id: input.ownerId },
        select: { matricula: true, curso: { select: { id: true, nome: true } } },
      });
      if (!owner) {
        throw new Error("SIGAA_OWNER_NOT_FOUND");
      }

      const times = await this.databaseTimes(transaction);
      const existingConnection = await transaction.sigaaConnection.findUnique({
        where: { usuarioId: input.ownerId },
      });

      if (
        existingConnection?.leaseRunId &&
        existingConnection.leaseExpiresAt &&
        existingConnection.leaseExpiresAt > times.now
      ) {
        return { kind: "busy", retryAt: existingConnection.leaseExpiresAt };
      }

      const connection = await transaction.sigaaConnection.upsert({
        where: { usuarioId: input.ownerId },
        create: {
          usuarioId: input.ownerId,
          consentVersion: input.consentVersion,
          consentedAt: times.now,
        },
        update: {
          consentVersion: input.consentVersion,
          consentedAt: times.now,
        },
      });

      if (connection.leaseRunId) {
        await transaction.sigaaSyncRun.updateMany({
          where: { id: connection.leaseRunId, status: "RUNNING" },
          data: {
            status: "SUPERSEDED",
            failureCode: "LEASE_LOST",
            finalizadoEm: times.now,
            retentionExpiresAt: times.retentionExpiresAt,
          },
        });
      }

      const runId = sigaaRunIdSchema.parse(randomUUID());
      const secret = leaseSecretSchema.parse(randomBytes(32).toString("hex"));
      const generation = connection.leaseGeneration + BigInt(1);
      const identityToken = courseIdentityToken(owner.curso.id, owner.curso.nome);

      await transaction.sigaaSyncRun.create({
        data: {
          id: runId,
          usuarioId: input.ownerId,
          idempotencyKey: input.idempotencyKey,
          leaseGeneration: generation,
          leaseExpiresAt: times.leaseExpiresAt,
          courseIdentityToken: identityToken,
          consentVersion: input.consentVersion,
        },
      });
      await transaction.sigaaConnection.update({
        where: { usuarioId: input.ownerId },
        data: {
          status: connection.status === "DISCONNECTED" ? "PENDING" : connection.status,
          leaseGeneration: generation,
          leaseRunId: runId,
          leaseTokenDigest: digest(secret),
          leaseExpiresAt: times.leaseExpiresAt,
        },
      });

      return {
        kind: "reserved",
        lease: {
          runId,
          generation,
          secret,
          expiresAt: times.leaseExpiresAt,
          courseIdentityToken: identityToken,
          expectedMatricula: owner.matricula ? matriculaSchema.parse(owner.matricula) : null,
        },
      };
    });
  }

  async commitLatest(input: {
    ownerId: UsuarioId;
    lease: LeaseGrant;
    candidate: SigaaSnapshotCandidate;
  }): Promise<CommitLatestResult> {
    const candidate = parseSigaaSnapshotCandidate(input.candidate);
    const payload = toSigaaAcademicSnapshotPayload(candidate);

    try {
      return await this.database.$transaction(async transaction => {
        await this.lockAggregate(transaction, input.ownerId);
        await this.lockUsuario(transaction, input.ownerId);
        await this.lockConnection(transaction, input.ownerId);

        const [owner, connection, run] = await Promise.all([
          transaction.usuario.findUnique({
            where: { id: input.ownerId },
            select: {
              matricula: true,
              matriculaOrigem: true,
              curso: { select: { id: true, nome: true } },
            },
          }),
          transaction.sigaaConnection.findUnique({ where: { usuarioId: input.ownerId } }),
          transaction.sigaaSyncRun.findFirst({
            where: { id: input.lease.runId, usuarioId: input.ownerId },
          }),
        ]);

        if (!owner || !connection || !run) {
          throw new Error("SIGAA_ATTEMPT_NOT_FOUND");
        }

        const times = await this.databaseTimes(transaction);
        const ownsAuthenticatedLease =
          run.status === "RUNNING" &&
          connection.leaseRunId === run.id &&
          connection.leaseGeneration === input.lease.generation &&
          run.leaseGeneration === input.lease.generation &&
          input.lease.courseIdentityToken === run.courseIdentityToken &&
          connection.leaseTokenDigest !== null &&
          secretsEqual(connection.leaseTokenDigest, digest(input.lease.secret));

        if (!ownsAuthenticatedLease) {
          return { kind: "rejected", run: toRunReceipt(run), failure: "LEASE_LOST" };
        }

        if (
          connection.leaseExpiresAt === null ||
          connection.leaseExpiresAt <= times.now ||
          run.leaseExpiresAt <= times.now
        ) {
          const superseded = await this.supersedeCurrentAttempt(
            transaction,
            input.ownerId,
            run.id,
            input.lease.generation,
            times
          );
          return { kind: "rejected", run: superseded, failure: "LEASE_LOST" };
        }

        const currentCourseToken = courseIdentityToken(owner.curso.id, owner.curso.nome);
        if (
          currentCourseToken !== run.courseIdentityToken ||
          candidate.identity.sourceCourse === null ||
          !this.courseMatches(owner.curso.nome, candidate.identity.sourceCourse)
        ) {
          const rejected = await this.rejectCurrentAttempt(
            transaction,
            input.ownerId,
            run.id,
            input.lease.generation,
            "COURSE_MISMATCH",
            times
          );
          return { kind: "rejected", run: rejected, failure: "COURSE_MISMATCH" };
        }

        await this.lockMatricula(transaction, candidate.identity.matricula);
        const conflictingOwner = await transaction.usuario.findFirst({
          where: {
            matricula: candidate.identity.matricula,
            id: { not: input.ownerId },
          },
          select: { id: true },
        });
        if (
          conflictingOwner ||
          (owner.matricula !== null && owner.matricula !== candidate.identity.matricula)
        ) {
          const rejected = await this.rejectCurrentAttempt(
            transaction,
            input.ownerId,
            run.id,
            input.lease.generation,
            "SIGAA_IDENTITY_MISMATCH",
            times
          );
          return { kind: "rejected", run: rejected, failure: "SIGAA_IDENTITY_MISMATCH" };
        }

        await transaction.usuario.update({
          where: { id: input.ownerId },
          data: {
            matricula: candidate.identity.matricula,
            matriculaOrigem: owner.matricula === null ? "SIGAA" : owner.matriculaOrigem,
            matriculaVerificadaPeloSigaaEm: times.now,
          },
        });

        const snapshot = await transaction.sigaaAcademicSnapshot.upsert({
          where: { usuarioId: input.ownerId },
          create: {
            usuarioId: input.ownerId,
            contractVersion: candidate.contractVersion,
            connectorObservedAt: candidate.connectorObservedAt,
            synchronizedAt: times.now,
            upstreamCommit: candidate.upstreamCommit,
            installedByRunId: run.id,
            payload,
          },
          update: {
            contractVersion: candidate.contractVersion,
            connectorObservedAt: candidate.connectorObservedAt,
            synchronizedAt: times.now,
            upstreamCommit: candidate.upstreamCommit,
            installedByRunId: run.id,
            payload,
          },
        });

        const completedRun = await transaction.sigaaSyncRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCEEDED",
            failureCode: null,
            connectorRequestId: candidate.connectorRequestId,
            contractVersion: candidate.contractVersion,
            upstreamCommit: candidate.upstreamCommit,
            componentCount: candidate.curriculum.components.length,
            gradeCount: candidate.grades.length,
            classCount: candidate.classes.length,
            finalizadoEm: times.now,
            retentionExpiresAt: times.retentionExpiresAt,
          },
        });
        await transaction.sigaaConnection.update({
          where: { usuarioId: input.ownerId },
          data: {
            status: "CONNECTED",
            connectedAt:
              connection.status === "CONNECTED" ? (connection.connectedAt ?? times.now) : times.now,
            disconnectedAt: null,
            leaseRunId: null,
            leaseTokenDigest: null,
            leaseExpiresAt: null,
          },
        });

        return {
          kind: "committed",
          run: toRunReceipt(completedRun),
          synchronizedAt: snapshot.synchronizedAt,
        };
      });
    } catch (error) {
      if (isMatriculaUniqueViolation(error)) {
        return this.closeMatriculaConflict(input.ownerId, input.lease);
      }
      throw error;
    }
  }

  finishAttempt(input: {
    ownerId: UsuarioId;
    lease: LeaseGrant;
    failure: SigaaSyncFailureCode;
    connectorRequestId?: string;
  }): Promise<SigaaRunReceipt> {
    return this.database.$transaction(async transaction => {
      await this.lockAggregate(transaction, input.ownerId);
      await this.lockConnection(transaction, input.ownerId);

      const [connection, run] = await Promise.all([
        transaction.sigaaConnection.findUnique({ where: { usuarioId: input.ownerId } }),
        transaction.sigaaSyncRun.findFirst({
          where: { id: input.lease.runId, usuarioId: input.ownerId },
        }),
      ]);
      if (!connection || !run) {
        throw new Error("SIGAA_ATTEMPT_NOT_FOUND");
      }
      if (run.status !== "RUNNING") {
        return toRunReceipt(run);
      }

      const ownsCurrentLease =
        connection.leaseRunId === run.id && connection.leaseGeneration === input.lease.generation;
      if (
        ownsCurrentLease &&
        (!connection.leaseTokenDigest ||
          !secretsEqual(connection.leaseTokenDigest, digest(input.lease.secret)))
      ) {
        throw new Error("SIGAA_LEASE_TOKEN_INVALID");
      }

      const times = await this.databaseTimes(transaction);
      const completedRun = await transaction.sigaaSyncRun.update({
        where: { id: run.id },
        data: {
          status: input.failure === "LEASE_LOST" ? "SUPERSEDED" : "FAILED",
          failureCode: input.failure,
          connectorRequestId: input.connectorRequestId,
          finalizadoEm: times.now,
          retentionExpiresAt: times.retentionExpiresAt,
        },
      });

      if (ownsCurrentLease) {
        await transaction.sigaaConnection.update({
          where: { usuarioId: input.ownerId },
          data: { leaseRunId: null, leaseTokenDigest: null, leaseExpiresAt: null },
        });
      }

      return toRunReceipt(completedRun);
    });
  }

  async readImportedState(ownerId: UsuarioId): Promise<ImportedAcademicState> {
    const owner = await this.database.usuario.findUnique({
      where: { id: ownerId },
      select: {
        matricula: true,
        matriculaOrigem: true,
        matriculaVerificadaPeloSigaaEm: true,
        sigaaConnection: {
          include: { snapshot: true },
        },
      },
    });
    if (!owner) {
      throw new Error("SIGAA_OWNER_NOT_FOUND");
    }

    const connection = owner.sigaaConnection;
    return {
      matricula: {
        value: owner.matricula,
        origin: owner.matriculaOrigem,
        verifiedAt: owner.matriculaVerificadaPeloSigaaEm,
      },
      connection: connection
        ? {
            status: connection.status,
            consentVersion: connection.consentVersion,
            consentedAt: connection.consentedAt,
            connectedAt: connection.connectedAt,
            disconnectedAt: connection.disconnectedAt,
          }
        : null,
      snapshot: connection?.snapshot
        ? {
            contractVersion: connection.snapshot.contractVersion,
            connectorObservedAt: connection.snapshot.connectorObservedAt,
            synchronizedAt: connection.snapshot.synchronizedAt,
            upstreamCommit: connection.snapshot.upstreamCommit,
            installedByRunId: connection.snapshot.installedByRunId,
            payload: parseSigaaAcademicSnapshotPayload(connection.snapshot.payload),
          }
        : null,
    };
  }

  disconnect(ownerId: UsuarioId): Promise<DisconnectResult> {
    return this.database.$transaction(async transaction => {
      await this.lockAggregate(transaction, ownerId);
      await this.lockRateLimit(transaction, ownerId, "DISCONNECT");
      const limit = await this.consumeRateLimitInTransaction(transaction, ownerId, "DISCONNECT");
      if (limit.kind === "rate_limited") {
        return limit;
      }

      await this.lockConnection(transaction, ownerId);
      const times = await this.databaseTimes(transaction);
      const connection = await transaction.sigaaConnection.findUnique({
        where: { usuarioId: ownerId },
      });
      if (!connection) {
        return { kind: "disconnected", disconnectedAt: times.now };
      }

      if (connection.leaseRunId) {
        await transaction.sigaaSyncRun.updateMany({
          where: { id: connection.leaseRunId, status: "RUNNING" },
          data: {
            status: "SUPERSEDED",
            failureCode: "LEASE_LOST",
            finalizadoEm: times.now,
            retentionExpiresAt: times.retentionExpiresAt,
          },
        });
      }
      await transaction.sigaaConnection.update({
        where: { usuarioId: ownerId },
        data: {
          status: "DISCONNECTED",
          disconnectedAt: times.now,
          leaseRunId: null,
          leaseTokenDigest: null,
          leaseExpiresAt: null,
        },
      });

      return { kind: "disconnected", disconnectedAt: times.now };
    });
  }

  deleteImportedData(ownerId: UsuarioId): Promise<DeleteImportedDataResult> {
    return this.database.$transaction(async transaction => {
      await this.lockAggregate(transaction, ownerId);
      await this.lockRateLimit(transaction, ownerId, "DELETE_IMPORTED_DATA");
      const limit = await this.consumeRateLimitInTransaction(
        transaction,
        ownerId,
        "DELETE_IMPORTED_DATA"
      );
      if (limit.kind === "rate_limited") {
        return limit;
      }

      await this.lockUsuario(transaction, ownerId);
      await this.lockConnection(transaction, ownerId);
      const owner = await transaction.usuario.findUnique({
        where: { id: ownerId },
        select: {
          matricula: true,
          matriculaOrigem: true,
          sigaaConnection: { include: { snapshot: true } },
        },
      });
      if (!owner) {
        throw new Error("SIGAA_OWNER_NOT_FOUND");
      }

      const snapshotPayload = owner.sigaaConnection?.snapshot
        ? parseSigaaAcademicSnapshotPayload(owner.sigaaConnection.snapshot.payload)
        : null;
      const matriculaCleared =
        owner.matriculaOrigem === "SIGAA" &&
        owner.matricula !== null &&
        snapshotPayload?.identity.matricula === owner.matricula;

      if (matriculaCleared) {
        await transaction.usuario.update({
          where: { id: ownerId },
          data: {
            matricula: null,
            matriculaOrigem: null,
            matriculaVerificadaPeloSigaaEm: null,
          },
        });
      } else if (owner.matricula !== null) {
        await transaction.usuario.update({
          where: { id: ownerId },
          data: { matriculaVerificadaPeloSigaaEm: null },
        });
      }

      const deleted = await transaction.sigaaConnection.deleteMany({
        where: { usuarioId: ownerId },
      });
      return {
        kind: "deleted",
        hadImportedData: deleted.count > 0,
        matriculaCleared,
      };
    });
  }

  deleteExpiredRuns(): Promise<{ deleted: number }> {
    return this.database.$transaction(async transaction => {
      const expired = await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "SigaaSyncRun"
        WHERE "status" <> 'RUNNING'::"SigaaSyncRunStatus"
          AND "retentionExpiresAt" <= clock_timestamp()
        FOR UPDATE
      `;
      const expiredIds = expired.map(({ id }) => id);
      if (expiredIds.length === 0) {
        return { deleted: 0 };
      }

      await transaction.sigaaAcademicSnapshot.updateMany({
        where: { installedByRunId: { in: expiredIds } },
        data: { installedByRunId: null },
      });
      const deleted = await transaction.sigaaSyncRun.deleteMany({
        where: { id: { in: expiredIds } },
      });
      return { deleted: deleted.count };
    });
  }

  private async rejectCurrentAttempt(
    transaction: Transaction,
    ownerId: UsuarioId,
    runId: string,
    generation: bigint,
    failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH",
    times: DatabaseTimes
  ): Promise<SigaaRunReceipt> {
    const run = await transaction.sigaaSyncRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        failureCode: failure,
        finalizadoEm: times.now,
        retentionExpiresAt: times.retentionExpiresAt,
      },
    });
    await transaction.sigaaConnection.updateMany({
      where: { usuarioId: ownerId, leaseRunId: runId, leaseGeneration: generation },
      data: { leaseRunId: null, leaseTokenDigest: null, leaseExpiresAt: null },
    });
    return toRunReceipt(run);
  }

  private async supersedeCurrentAttempt(
    transaction: Transaction,
    ownerId: UsuarioId,
    runId: string,
    generation: bigint,
    times: DatabaseTimes
  ): Promise<SigaaRunReceipt> {
    const run = await transaction.sigaaSyncRun.update({
      where: { id: runId },
      data: {
        status: "SUPERSEDED",
        failureCode: "LEASE_LOST",
        finalizadoEm: times.now,
        retentionExpiresAt: times.retentionExpiresAt,
      },
    });
    await transaction.sigaaConnection.updateMany({
      where: { usuarioId: ownerId, leaseRunId: runId, leaseGeneration: generation },
      data: { leaseRunId: null, leaseTokenDigest: null, leaseExpiresAt: null },
    });
    return toRunReceipt(run);
  }

  private closeMatriculaConflict(
    ownerId: UsuarioId,
    lease: LeaseGrant
  ): Promise<CommitLatestResult> {
    return this.database.$transaction(async transaction => {
      await this.lockAggregate(transaction, ownerId);
      await this.lockUsuario(transaction, ownerId);
      await this.lockConnection(transaction, ownerId);
      const [connection, run] = await Promise.all([
        transaction.sigaaConnection.findUnique({ where: { usuarioId: ownerId } }),
        transaction.sigaaSyncRun.findFirst({ where: { id: lease.runId, usuarioId: ownerId } }),
      ]);
      if (!connection || !run) {
        throw new Error("SIGAA_ATTEMPT_NOT_FOUND");
      }

      const authenticated =
        run.status === "RUNNING" &&
        connection.leaseRunId === run.id &&
        connection.leaseGeneration === lease.generation &&
        run.leaseGeneration === lease.generation &&
        lease.courseIdentityToken === run.courseIdentityToken &&
        connection.leaseTokenDigest !== null &&
        secretsEqual(connection.leaseTokenDigest, digest(lease.secret));
      if (!authenticated) {
        return { kind: "rejected", run: toRunReceipt(run), failure: "LEASE_LOST" };
      }

      const times = await this.databaseTimes(transaction);
      if (
        connection.leaseExpiresAt === null ||
        connection.leaseExpiresAt <= times.now ||
        run.leaseExpiresAt <= times.now
      ) {
        const superseded = await this.supersedeCurrentAttempt(
          transaction,
          ownerId,
          run.id,
          lease.generation,
          times
        );
        return { kind: "rejected", run: superseded, failure: "LEASE_LOST" };
      }

      const rejected = await this.rejectCurrentAttempt(
        transaction,
        ownerId,
        run.id,
        lease.generation,
        "SIGAA_IDENTITY_MISMATCH",
        times
      );
      return { kind: "rejected", run: rejected, failure: "SIGAA_IDENTITY_MISMATCH" };
    });
  }

  private async consumeRateLimitInTransaction(
    transaction: Transaction,
    ownerId: UsuarioId,
    operation: SigaaRateLimitOperation
  ): Promise<RateLimitDecision> {
    const policy = RATE_LIMIT_POLICIES[operation];
    const [databaseTime] = await transaction.$queryRaw<Array<{ now: Date; resetAt: Date }>>`
      SELECT
        clock_timestamp() AS "now",
        clock_timestamp() + make_interval(secs => ${policy.windowSeconds}) AS "resetAt"
    `;
    const bucket = await transaction.sigaaRateLimitBucket.findUnique({
      where: { usuarioId_operation: { usuarioId: ownerId, operation } },
    });

    if (!bucket || bucket.resetAt <= databaseTime.now) {
      await transaction.sigaaRateLimitBucket.upsert({
        where: { usuarioId_operation: { usuarioId: ownerId, operation } },
        create: {
          usuarioId: ownerId,
          operation,
          count: 1,
          windowStartedAt: databaseTime.now,
          resetAt: databaseTime.resetAt,
        },
        update: {
          count: 1,
          windowStartedAt: databaseTime.now,
          resetAt: databaseTime.resetAt,
        },
      });
      return { kind: "allowed", remaining: policy.limit - 1, resetAt: databaseTime.resetAt };
    }

    if (bucket.count >= policy.limit) {
      return { kind: "rate_limited", retryAt: bucket.resetAt };
    }

    const updated = await transaction.sigaaRateLimitBucket.update({
      where: { usuarioId_operation: { usuarioId: ownerId, operation } },
      data: { count: { increment: 1 } },
    });
    return {
      kind: "allowed",
      remaining: policy.limit - updated.count,
      resetAt: updated.resetAt,
    };
  }

  private async databaseTimes(transaction: Transaction): Promise<DatabaseTimes> {
    const [times] = await transaction.$queryRaw<DatabaseTimes[]>`
      SELECT
        clock_timestamp() AS "now",
        clock_timestamp() + make_interval(secs => ${LEASE_SECONDS}) AS "leaseExpiresAt",
        clock_timestamp() + make_interval(secs => ${RETENTION_SECONDS}) AS "retentionExpiresAt"
    `;
    return times;
  }

  private async lockAggregate(transaction: Transaction, ownerId: UsuarioId): Promise<void> {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`sigaa:aggregate:${ownerId}`}, 0))
    `;
  }

  private async lockRateLimit(
    transaction: Transaction,
    ownerId: UsuarioId,
    operation: SigaaRateLimitOperation
  ): Promise<void> {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`sigaa:rate:${ownerId}:${operation}`}, 0))
    `;
  }

  private async lockMatricula(transaction: Transaction, matricula: string): Promise<void> {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${sigaaMatriculaLockKey(matricula)}, 0))
    `;
  }

  private async lockUsuario(transaction: Transaction, ownerId: UsuarioId): Promise<void> {
    await transaction.$queryRaw`
      SELECT "id" FROM "Usuario" WHERE "id" = ${ownerId} FOR UPDATE
    `;
  }

  private async lockConnection(transaction: Transaction, ownerId: UsuarioId): Promise<void> {
    await transaction.$queryRaw`
      SELECT "usuarioId" FROM "SigaaConnection" WHERE "usuarioId" = ${ownerId} FOR UPDATE
    `;
  }
}
