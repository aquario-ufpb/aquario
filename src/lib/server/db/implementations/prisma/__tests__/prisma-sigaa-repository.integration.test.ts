import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaSigaaRepository } from "@/lib/server/db/implementations/prisma/prisma-sigaa-repository";
import { PrismaUsuariosRepository } from "@/lib/server/db/implementations/prisma/prisma-usuarios-repository";
import { prisma as sharedPrisma } from "@/lib/server/db/prisma";
import {
  idempotencyKeySchema,
  leaseSecretSchema,
  sigaaSnapshotCandidateSchema,
  usuarioIdSchema,
  type SigaaSnapshotCandidate,
  type UsuarioId,
} from "@/lib/server/services/sigaa/storage.types";

const database = new PrismaClient();
const repository = new PrismaSigaaRepository(database);
const testCourseNames = [
  "Ciência da Computação",
  "Ciencia da Computacao",
  "Ciência da Computação (Bacharelado)",
] as const;
let testCourseNameIndex = 0;

type OwnerOptions = {
  matricula?: string;
  matriculaOrigem?: "LEGACY" | "MANUAL";
  courseName?: string;
};

async function createOwner(options: OwnerOptions = {}): Promise<UsuarioId> {
  const campus = await database.campus.create({ data: { nome: `Campus ${randomUUID()}` } });
  const centro = await database.centro.create({
    data: {
      nome: `Centro ${randomUUID()}`,
      sigla: `C${randomUUID().slice(0, 7)}`,
      campusId: campus.id,
    },
  });
  const curso = await database.curso.create({
    data: {
      nome: options.courseName ?? testCourseNames[testCourseNameIndex++ % testCourseNames.length],
      centroId: centro.id,
    },
  });
  const owner = await database.usuario.create({
    data: {
      nome: "Usuário de teste",
      email: `${randomUUID()}@example.com`,
      centroId: centro.id,
      cursoId: curso.id,
      matricula: options.matricula,
      matriculaOrigem: options.matricula ? (options.matriculaOrigem ?? "MANUAL") : null,
    },
  });
  return usuarioIdSchema.parse(owner.id);
}

async function ownerCourse(ownerId: UsuarioId): Promise<string> {
  const owner = await database.usuario.findUniqueOrThrow({
    where: { id: ownerId },
    select: { curso: { select: { nome: true } } },
  });
  return owner.curso.nome;
}

function candidate(matricula: string, courseName: string, marker = "A"): SigaaSnapshotCandidate {
  return sigaaSnapshotCandidateSchema.parse({
    contractVersion: "1.0",
    connectorObservedAt: new Date(),
    connectorRequestId: randomUUID(),
    upstreamCommit: marker.toLowerCase().repeat(40),
    identity: {
      matricula,
      sourceCourse: courseName,
      sourceSemester: "2026.1",
    },
    curriculum: {
      code: "2026.1",
      maximumCompletionTerm: "2031.2",
      semesterWorkload: { minimum: 240, maximum: 480 },
      cra: { value: "8.50", source: "academic_transcript" },
      progress: [
        {
          description: "Total",
          completedHours: 120,
          totalHours: 300,
          remainingHours: 180,
          completedPercent: 40,
        },
      ],
      components: [
        {
          code: `DCC10${marker}`,
          name: `Componente ${marker}`,
          integrationType: "OB",
          period: 1,
          workloadHours: 60,
          required: true,
          status: "completed",
          prerequisite: null,
          corequisite: null,
        },
      ],
    },
    grades: [],
    classes: [],
  });
}

async function reserve(ownerId: UsuarioId, key = randomUUID()) {
  const result = await repository.reserveAttempt({
    ownerId,
    idempotencyKey: idempotencyKeySchema.parse(key),
    consentVersion: "sigaa-v1-2026-08",
  });
  expect(result.kind).toBe("reserved");
  if (result.kind !== "reserved") {
    throw new Error(`Expected reservation, received ${result.kind}`);
  }
  return result.lease;
}

beforeEach(async () => {
  testCourseNameIndex = 0;
  await database.$executeRawUnsafe('TRUNCATE TABLE "Campus" CASCADE');
});

afterAll(async () => {
  await Promise.all([database.$disconnect(), sharedPrisma.$disconnect()]);
});

describe("PrismaSigaaRepository on PostgreSQL", () => {
  it("enforces provenance, lease, lifecycle, and secret-column constraints", async () => {
    const ownerId = await createOwner();
    await expect(
      database.$executeRawUnsafe(
        'UPDATE "Usuario" SET "matricula" = $1 WHERE "id" = $2',
        "20260000001",
        ownerId
      )
    ).rejects.toThrow();

    await database.sigaaConnection.create({ data: { usuarioId: ownerId } });
    await expect(
      database.$executeRawUnsafe(
        'UPDATE "SigaaConnection" SET "leaseTokenDigest" = $1 WHERE "usuarioId" = $2',
        "a".repeat(64),
        ownerId
      )
    ).rejects.toThrow();
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO "SigaaSyncRun"
          ("id", "usuarioId", "idempotencyKey", "leaseGeneration", "leaseExpiresAt", "courseIdentityToken", "consentVersion", "finalizadoEm")
         VALUES ($1, $2, $3, 1, clock_timestamp() + interval '4 minutes', $4, $5, clock_timestamp())`,
        randomUUID(),
        ownerId,
        randomUUID(),
        "a".repeat(64),
        "sigaa-v1-2026-08"
      )
    ).rejects.toThrow();

    const columns = await database.$queryRaw<Array<{ table_name: string; column_name: string }>>`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name LIKE 'Sigaa%'
    `;
    expect(
      columns.filter(({ column_name }) =>
        /password|senha|username|cookie|html|pdf|viewstate|rawbody|rawerror|bearer/i.test(
          column_name
        )
      )
    ).toEqual([]);
  });

  it("enforces owner-scoped run references and repository isolation across users", async () => {
    const firstOwner = await createOwner();
    const secondOwner = await createOwner();
    const firstLease = await reserve(firstOwner);
    const secondLease = await reserve(secondOwner);

    await expect(
      database.$executeRaw`
        UPDATE "SigaaConnection"
        SET "leaseRunId" = ${secondLease.runId}
        WHERE "usuarioId" = ${firstOwner}
      `
    ).rejects.toThrow();
    await expect(
      repository.commitLatest({
        ownerId: secondOwner,
        lease: firstLease,
        candidate: candidate("20260000011", await ownerCourse(secondOwner)),
      })
    ).rejects.toThrow("SIGAA_ATTEMPT_NOT_FOUND");
    expect(
      await database.sigaaSyncRun.findUniqueOrThrow({ where: { id: firstLease.runId } })
    ).toMatchObject({ status: "RUNNING", failureCode: null });

    await repository.commitLatest({
      ownerId: firstOwner,
      lease: firstLease,
      candidate: candidate("20260000012", await ownerCourse(firstOwner), "c"),
    });
    await repository.commitLatest({
      ownerId: secondOwner,
      lease: secondLease,
      candidate: candidate("20260000013", await ownerCourse(secondOwner), "d"),
    });
    await expect(
      database.$executeRaw`
        UPDATE "SigaaAcademicSnapshot"
        SET "installedByRunId" = ${secondLease.runId}
        WHERE "usuarioId" = ${firstOwner}
      `
    ).rejects.toThrow();
    expect((await repository.readImportedState(firstOwner)).matricula.value).toBe("20260000012");
    expect((await repository.readImportedState(secondOwner)).matricula.value).toBe("20260000013");
  });

  it("checks idempotency before charging the synchronization budget", async () => {
    const ownerId = await createOwner();
    const key = randomUUID();
    const [first, replay] = await Promise.all(
      Array.from({ length: 2 }, () =>
        repository.reserveAttempt({
          ownerId,
          idempotencyKey: idempotencyKeySchema.parse(key),
          consentVersion: "sigaa-v1-2026-08",
        })
      )
    );

    expect([first.kind, replay.kind].sort()).toEqual(["replay", "reserved"]);
    expect(
      await database.sigaaRateLimitBucket.findUniqueOrThrow({
        where: { usuarioId_operation: { usuarioId: ownerId, operation: "SYNC" } },
      })
    ).toMatchObject({ count: 1 });
  });

  it("supersedes expired generations and rejects their late commits", async () => {
    const ownerId = await createOwner();
    const courseName = await ownerCourse(ownerId);
    const firstLease = await reserve(ownerId);

    await database.sigaaConnection.update({
      where: { usuarioId: ownerId },
      data: { leaseExpiresAt: new Date(Date.now() - 60_000) },
    });
    const secondLease = await reserve(ownerId);

    const stale = await repository.commitLatest({
      ownerId,
      lease: firstLease,
      candidate: candidate("20260000001", courseName, "a"),
    });
    expect(stale).toMatchObject({ kind: "rejected", failure: "LEASE_LOST" });

    const latest = await repository.commitLatest({
      ownerId,
      lease: secondLease,
      candidate: candidate("20260000001", courseName, "b"),
    });
    expect(latest.kind).toBe("committed");
    expect((await repository.readImportedState(ownerId)).snapshot?.upstreamCommit).toBe(
      "b".repeat(40)
    );
    expect(
      await database.sigaaSyncRun.findUniqueOrThrow({ where: { id: firstLease.runId } })
    ).toMatchObject({
      status: "SUPERSEDED",
      failureCode: "LEASE_LOST",
    });
  });

  it("closes an authenticated attempt when the run lease expires without a replacement", async () => {
    const ownerId = await createOwner();
    const lease = await reserve(ownerId);
    await database.sigaaSyncRun.update({
      where: { id: lease.runId },
      data: { leaseExpiresAt: new Date(Date.now() - 60_000) },
    });

    expect(
      await repository.commitLatest({
        ownerId,
        lease,
        candidate: candidate("20260000014", await ownerCourse(ownerId)),
      })
    ).toMatchObject({
      kind: "rejected",
      failure: "LEASE_LOST",
      run: { status: "SUPERSEDED", failureCode: "LEASE_LOST" },
    });
    expect(
      await database.sigaaSyncRun.findUniqueOrThrow({ where: { id: lease.runId } })
    ).toMatchObject({
      status: "SUPERSEDED",
      failureCode: "LEASE_LOST",
      finalizadoEm: expect.any(Date),
      retentionExpiresAt: expect.any(Date),
    });
    expect(
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).toMatchObject({ leaseRunId: null, leaseTokenDigest: null, leaseExpiresAt: null });
    expect(
      await database.sigaaAcademicSnapshot.findUnique({ where: { usuarioId: ownerId } })
    ).toBeNull();
  });

  it("closes an authenticated attempt when the connection lease expires without a replacement", async () => {
    const ownerId = await createOwner();
    const lease = await reserve(ownerId);
    await database.sigaaConnection.update({
      where: { usuarioId: ownerId },
      data: { leaseExpiresAt: new Date(Date.now() - 60_000) },
    });

    expect(
      await repository.commitLatest({
        ownerId,
        lease,
        candidate: candidate("20260000018", await ownerCourse(ownerId)),
      })
    ).toMatchObject({
      kind: "rejected",
      failure: "LEASE_LOST",
      run: { status: "SUPERSEDED", failureCode: "LEASE_LOST" },
    });
    expect(
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).toMatchObject({ leaseRunId: null, leaseTokenDigest: null, leaseExpiresAt: null });
  });

  it("does not mutate an attempt when a supplied lease authentication token is invalid", async () => {
    const ownerId = await createOwner();
    const lease = await reserve(ownerId);
    const invalidLease = { ...lease, secret: leaseSecretSchema.parse("f".repeat(64)) };

    expect(
      await repository.commitLatest({
        ownerId,
        lease: invalidLease,
        candidate: candidate("20260000015", await ownerCourse(ownerId)),
      })
    ).toMatchObject({ kind: "rejected", failure: "LEASE_LOST", run: { status: "RUNNING" } });
    expect(
      await repository.commitLatest({
        ownerId,
        lease: { ...lease, courseIdentityToken: "0".repeat(64) },
        candidate: candidate("20260000015", await ownerCourse(ownerId)),
      })
    ).toMatchObject({ kind: "rejected", failure: "LEASE_LOST", run: { status: "RUNNING" } });
    expect(
      await database.sigaaSyncRun.findUniqueOrThrow({ where: { id: lease.runId } })
    ).toMatchObject({
      status: "RUNNING",
      failureCode: null,
      finalizadoEm: null,
      retentionExpiresAt: null,
    });
    expect(
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).toMatchObject({ leaseRunId: lease.runId });
  });

  it("keeps consent unchanged when a live attempt makes a new reservation busy", async () => {
    const ownerId = await createOwner();
    await reserve(ownerId);
    const before = await database.sigaaConnection.findUniqueOrThrow({
      where: { usuarioId: ownerId },
    });

    expect(
      await repository.reserveAttempt({
        ownerId,
        idempotencyKey: idempotencyKeySchema.parse(randomUUID()),
        consentVersion: "sigaa-v2-should-not-stick",
      })
    ).toMatchObject({ kind: "busy" });
    expect(
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).toMatchObject({
      consentVersion: before.consentVersion,
      consentedAt: before.consentedAt,
      leaseRunId: before.leaseRunId,
    });
  });

  it("rejects a commit when the reserved course identity changed", async () => {
    const ownerId = await createOwner();
    const reservedCourse = await ownerCourse(ownerId);
    const lease = await reserve(ownerId);
    const owner = await database.usuario.findUniqueOrThrow({
      where: { id: ownerId },
      select: { cursoId: true },
    });
    await database.curso.update({
      where: { id: owner.cursoId },
      data: { nome: `Curso alterado ${randomUUID()}` },
    });

    expect(
      await repository.commitLatest({
        ownerId,
        lease,
        candidate: candidate("20260000006", reservedCourse),
      })
    ).toMatchObject({ kind: "rejected", failure: "COURSE_MISMATCH" });
    expect(
      await database.sigaaAcademicSnapshot.findUnique({ where: { usuarioId: ownerId } })
    ).toBeNull();
  });

  it("claims matricula atomically and rejects ownership conflicts without a snapshot", async () => {
    const claimedOwner = await createOwner();
    const claimedCourse = await ownerCourse(claimedOwner);
    const claimedLease = await reserve(claimedOwner);
    expect(
      await repository.commitLatest({
        ownerId: claimedOwner,
        lease: claimedLease,
        candidate: candidate("20260000002", claimedCourse),
      })
    ).toMatchObject({ kind: "committed" });
    expect(await database.usuario.findUniqueOrThrow({ where: { id: claimedOwner } })).toMatchObject(
      {
        matricula: "20260000002",
        matriculaOrigem: "SIGAA",
      }
    );

    const conflictingOwner = await createOwner();
    const conflictingCourse = await ownerCourse(conflictingOwner);
    const conflictingLease = await reserve(conflictingOwner);
    expect(
      await repository.commitLatest({
        ownerId: conflictingOwner,
        lease: conflictingLease,
        candidate: candidate("20260000002", conflictingCourse),
      })
    ).toMatchObject({ kind: "rejected", failure: "SIGAA_IDENTITY_MISMATCH" });
    expect(
      await database.usuario.findUniqueOrThrow({ where: { id: conflictingOwner } })
    ).toMatchObject({
      matricula: null,
      matriculaOrigem: null,
    });
    expect(
      await database.sigaaAcademicSnapshot.findUnique({ where: { usuarioId: conflictingOwner } })
    ).toBeNull();
  });

  it("serializes a SIGAA claim against a real manual Usuario writer", async () => {
    const sigaaOwner = await createOwner();
    const profile = await database.usuario.findUniqueOrThrow({
      where: { id: sigaaOwner },
      select: { centroId: true, cursoId: true },
    });
    const lease = await reserve(sigaaOwner);
    const matricula = "20260000016";
    const usuariosRepository = new PrismaUsuariosRepository();

    const [sigaaResult, manualResult] = await Promise.allSettled([
      repository.commitLatest({
        ownerId: sigaaOwner,
        lease,
        candidate: candidate(matricula, await ownerCourse(sigaaOwner)),
      }),
      usuariosRepository.create({
        nome: "Manual concorrente",
        email: `${randomUUID()}@example.com`,
        centroId: profile.centroId,
        cursoId: profile.cursoId,
        matricula,
      }),
    ]);

    expect(sigaaResult.status).toBe("fulfilled");
    if (sigaaResult.status === "fulfilled") {
      expect(sigaaResult.value).toMatchObject(
        manualResult.status === "fulfilled"
          ? { kind: "rejected", failure: "SIGAA_IDENTITY_MISMATCH" }
          : { kind: "committed" }
      );
    }
    if (manualResult.status === "rejected") {
      expect(manualResult.reason).toBeInstanceOf(Error);
      expect((manualResult.reason as Error).message).toBe("MATRICULA_ALREADY_IN_USE");
      expect((manualResult.reason as Error).message).not.toContain("P2002");
    }
    expect(await database.usuario.count({ where: { matricula } })).toBe(1);
  });

  it("preserves connectedAt across refreshes and resets it only after disconnect", async () => {
    const ownerId = await createOwner();
    const courseName = await ownerCourse(ownerId);
    const firstLease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease: firstLease,
      candidate: candidate("20260000017", courseName, "e"),
    });
    const firstConnectedAt = (
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).connectedAt;
    expect(firstConnectedAt).not.toBeNull();

    await database.$queryRaw`SELECT 1::integer AS "ready" FROM pg_sleep(0.02)`;
    const refreshLease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease: refreshLease,
      candidate: candidate("20260000017", courseName, "f"),
    });
    expect(
      (await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } }))
        .connectedAt
    ).toEqual(firstConnectedAt);

    await repository.disconnect(ownerId);
    await database.$queryRaw`SELECT 1::integer AS "ready" FROM pg_sleep(0.02)`;
    const reconnectLease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease: reconnectLease,
      candidate: candidate("20260000017", courseName, "0"),
    });
    const reconnectedAt = (
      await database.sigaaConnection.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).connectedAt;
    expect(reconnectedAt?.getTime()).toBeGreaterThan(firstConnectedAt?.getTime() ?? 0);
  });

  it("preserves manual matricula and academic rows through disconnect and imported-data deletion", async () => {
    const ownerId = await createOwner({
      matricula: "20260000003",
      matriculaOrigem: "MANUAL",
    });
    const owner = await database.usuario.findUniqueOrThrow({ where: { id: ownerId } });
    const discipline = await database.disciplina.create({
      data: { codigo: `D${randomUUID()}`, nome: "Disciplina manual" },
    });
    const semester = await database.semestreLetivo.create({
      data: {
        nome: `2026.1-${randomUUID()}`,
        dataInicio: new Date("2026-01-01T00:00:00Z"),
        dataFim: new Date("2026-06-30T00:00:00Z"),
      },
    });
    await database.disciplinaConcluida.create({
      data: { usuarioId: ownerId, disciplinaId: discipline.id },
    });
    await database.disciplinaSemestre.create({
      data: {
        usuarioId: ownerId,
        disciplinaId: discipline.id,
        semestreLetivoId: semester.id,
      },
    });

    const lease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease,
      candidate: candidate("20260000003", await ownerCourse(ownerId)),
    });
    await repository.disconnect(ownerId);
    expect((await repository.readImportedState(ownerId)).snapshot).not.toBeNull();

    expect(await repository.deleteImportedData(ownerId)).toMatchObject({
      kind: "deleted",
      matriculaCleared: false,
    });
    expect(await database.usuario.findUniqueOrThrow({ where: { id: owner.id } })).toMatchObject({
      matricula: "20260000003",
      matriculaOrigem: "MANUAL",
      matriculaVerificadaPeloSigaaEm: null,
    });
    expect(await database.disciplinaConcluida.count({ where: { usuarioId: ownerId } })).toBe(1);
    expect(await database.disciplinaSemestre.count({ where: { usuarioId: ownerId } })).toBe(1);
    expect(await database.sigaaConnection.findUnique({ where: { usuarioId: ownerId } })).toBeNull();
    expect(await database.sigaaRateLimitBucket.count({ where: { usuarioId: ownerId } })).toBe(3);
  });

  it("serializes concurrent limiter consumption without extending rejected windows", async () => {
    const ownerId = await createOwner();
    const decisions = await Promise.all(
      Array.from({ length: 10 }, () =>
        repository.consumeRateLimit({ ownerId, operation: "REAUTH" })
      )
    );
    expect(decisions.filter(({ kind }) => kind === "allowed")).toHaveLength(5);
    expect(decisions.filter(({ kind }) => kind === "rate_limited")).toHaveLength(5);

    const rejectedTimes = decisions
      .filter(decision => decision.kind === "rate_limited")
      .map(decision => decision.retryAt.getTime());
    expect(new Set(rejectedTimes)).toHaveLength(1);
    expect(
      await database.sigaaRateLimitBucket.findUniqueOrThrow({
        where: { usuarioId_operation: { usuarioId: ownerId, operation: "REAUTH" } },
      })
    ).toMatchObject({ count: 5 });
  });

  it("cascades owner deletion through every SIGAA persistence table", async () => {
    const ownerId = await createOwner();
    const lease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease,
      candidate: candidate("20260000004", await ownerCourse(ownerId)),
    });

    await database.usuario.delete({ where: { id: ownerId } });
    expect(await database.sigaaConnection.count({ where: { usuarioId: ownerId } })).toBe(0);
    expect(await database.sigaaAcademicSnapshot.count({ where: { usuarioId: ownerId } })).toBe(0);
    expect(await database.sigaaSyncRun.count({ where: { usuarioId: ownerId } })).toBe(0);
    expect(await database.sigaaRateLimitBucket.count({ where: { usuarioId: ownerId } })).toBe(0);
  });

  it("deletes only expired terminal runs and preserves the installed snapshot", async () => {
    const ownerId = await createOwner();
    const lease = await reserve(ownerId);
    await repository.commitLatest({
      ownerId,
      lease,
      candidate: candidate("20260000005", await ownerCourse(ownerId)),
    });
    await database.sigaaSyncRun.update({
      where: { id: lease.runId },
      data: { retentionExpiresAt: new Date(Date.now() - 60_000) },
    });

    expect(await repository.deleteExpiredRuns()).toEqual({ deleted: 1 });
    expect(await database.sigaaSyncRun.findUnique({ where: { id: lease.runId } })).toBeNull();
    expect(
      await database.sigaaAcademicSnapshot.findUniqueOrThrow({ where: { usuarioId: ownerId } })
    ).toMatchObject({
      installedByRunId: null,
    });

    const activeLease = await reserve(ownerId);
    await database.$executeRaw`
      UPDATE "SigaaSyncRun"
      SET "iniciadoEm" = clock_timestamp() - interval '120 days'
      WHERE "id" = ${activeLease.runId}
    `;
    expect(await repository.deleteExpiredRuns()).toEqual({ deleted: 0 });
    expect(
      await database.sigaaSyncRun.findUnique({ where: { id: activeLease.runId } })
    ).not.toBeNull();
  });
});
