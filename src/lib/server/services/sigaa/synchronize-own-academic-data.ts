import "server-only";

import type {
  ISigaaRepository,
  LeaseGrant,
  SigaaRunReceipt,
  SigaaSyncFailureCode,
} from "@/lib/server/db/interfaces/sigaa-repository.interface";
import { idempotencyKeySchema, usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

import { EphemeralSigaaCredentials, SigaaConnectorError, type ISigaaConnector } from "./connector";

export type SynchronizeOwnAcademicDataInput = Readonly<{
  ownerId: string;
  username: string;
  password: string;
  idempotencyKey: string;
  consentVersion: string;
}>;

export type SynchronizeOwnAcademicDataResult =
  | Readonly<{ kind: "synchronized"; run: SigaaRunReceipt; synchronizedAt: Date }>
  | Readonly<{ kind: "replay"; run: SigaaRunReceipt }>
  | Readonly<{ kind: "busy"; retryAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>
  | Readonly<{
      kind: "rejected";
      run: SigaaRunReceipt;
      failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH" | "LEASE_LOST";
    }>
  | Readonly<{ kind: "failed"; run: SigaaRunReceipt; failure: SigaaSyncFailureCode }>;

type SynchronizationDependencies = Readonly<{
  repository: ISigaaRepository;
  connector: ISigaaConnector;
}>;

export async function synchronizeOwnAcademicData(
  input: SynchronizeOwnAcademicDataInput,
  dependencies: SynchronizationDependencies
): Promise<SynchronizeOwnAcademicDataResult> {
  const ownerId = usuarioIdSchema.parse(input.ownerId);
  const reservation = await dependencies.repository.reserveAttempt({
    ownerId,
    idempotencyKey: idempotencyKeySchema.parse(input.idempotencyKey),
    consentVersion: input.consentVersion,
  });

  if (reservation.kind !== "reserved") {
    return reservation;
  }

  const lease = reservation.lease;

  try {
    const credentials = EphemeralSigaaCredentials.parse({
      username: input.username,
      password: input.password,
    });
    const candidate = await dependencies.connector.synchronize({
      credentials,
      expectedMatricula: lease.expectedMatricula,
    });
    const commit = await dependencies.repository.commitLatest({ ownerId, lease, candidate });

    if (commit.kind === "committed") {
      return {
        kind: "synchronized",
        run: commit.run,
        synchronizedAt: commit.synchronizedAt,
      };
    }

    return {
      kind: "rejected",
      run: commit.run,
      failure: commit.failure,
    };
  } catch (error) {
    const failure = toSafeFailureCode(error);
    const run = await finishSafely(dependencies.repository, ownerId, lease, failure, error);
    return { kind: "failed", run, failure };
  }
}

function toSafeFailureCode(error: unknown): SigaaSyncFailureCode {
  if (error instanceof SigaaConnectorError) {
    return error.code;
  }
  return "INTERNAL_ERROR";
}

function finishSafely(
  repository: ISigaaRepository,
  ownerId: ReturnType<typeof usuarioIdSchema.parse>,
  lease: LeaseGrant,
  failure: SigaaSyncFailureCode,
  error: unknown
): Promise<SigaaRunReceipt> {
  return repository.finishAttempt({
    ownerId,
    lease,
    failure,
    ...(error instanceof SigaaConnectorError && error.connectorRequestId
      ? { connectorRequestId: error.connectorRequestId }
      : {}),
  });
}
