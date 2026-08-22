import "server-only";

import type {
  ISigaaRepository,
  LeaseGrant,
  SigaaRunReceipt,
  SigaaSyncFailureCode,
} from "@/lib/server/db/interfaces/sigaa-repository.interface";
import { idempotencyKeySchema, usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

import { EphemeralSigaaCredentials, SigaaConnectorError, type ISigaaConnector } from "./connector";

export type ConfirmOwnCourseChangeInput = Readonly<{
  ownerId: string;
  proofProposalId: string | null;
  proposalId: string;
  username: string;
  password: string;
  idempotencyKey: string;
  consentVersion: string;
}>;

export type ConfirmOwnCourseChangeResult =
  | Readonly<{
      kind: "synchronized";
      run: SigaaRunReceipt;
      synchronizedAt: Date;
      courseReplaced: true;
    }>
  | Readonly<{ kind: "replay"; run: SigaaRunReceipt; courseReplaced: true }>
  | Readonly<{ kind: "busy"; retryAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>
  | Readonly<{ kind: "blocked"; reason: "proposal_invalid" | "reauth_proposal_mismatch" }>
  | Readonly<{ kind: "stale" }>
  | Readonly<{
      kind: "rejected";
      run: SigaaRunReceipt;
      failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH" | "LEASE_LOST";
      resolution: import("@/lib/server/db/interfaces/sigaa-repository.interface").SigaaCourseResolution;
    }>
  | Readonly<{ kind: "failed"; run: SigaaRunReceipt; failure: SigaaSyncFailureCode }>;

export async function confirmOwnCourseChange(
  input: ConfirmOwnCourseChangeInput,
  dependencies: Readonly<{ repository: ISigaaRepository; connector: ISigaaConnector }>
): Promise<ConfirmOwnCourseChangeResult> {
  const ownerId = usuarioIdSchema.parse(input.ownerId);
  const reservation = await dependencies.repository.reserveCourseChangeConfirmation({
    ownerId,
    proposalId: input.proposalId,
    proofProposalId: input.proofProposalId,
    idempotencyKey: idempotencyKeySchema.parse(input.idempotencyKey),
    consentVersion: input.consentVersion,
  });
  if (reservation.kind !== "reserved") {
    return reservation;
  }

  const lease = reservation.lease;
  try {
    const candidate = await dependencies.connector.synchronize({
      credentials: EphemeralSigaaCredentials.parse({
        username: input.username,
        password: input.password,
      }),
      expectedMatricula: lease.expectedMatricula,
    });
    const commit = await dependencies.repository.commitCourseChange({
      ownerId,
      proposalId: reservation.proposalId,
      lease,
      candidate,
    });
    if (commit.kind === "committed") {
      return {
        kind: "synchronized",
        run: commit.run,
        synchronizedAt: commit.synchronizedAt,
        courseReplaced: true,
      };
    }
    return {
      kind: "rejected",
      run: commit.run,
      failure: commit.failure,
      resolution: commit.resolution,
    };
  } catch (error) {
    const failure = error instanceof SigaaConnectorError ? error.code : "INTERNAL_ERROR";
    const run = await finishSafely(dependencies.repository, ownerId, lease, failure, error);
    return { kind: "failed", run, failure };
  }
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
