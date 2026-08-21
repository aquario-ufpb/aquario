import type {
  IdempotencyKey,
  LeaseSecret,
  Matricula,
  SigaaAcademicSnapshotPayload,
  SigaaRunId,
  SigaaSnapshotCandidate,
  UsuarioId,
} from "@/lib/server/services/sigaa/storage.types";

export type SigaaRateLimitOperation = "REAUTH" | "SYNC" | "DISCONNECT" | "DELETE_IMPORTED_DATA";

export type SigaaSyncFailureCode =
  | "SIGAA_AUTH_FAILED"
  | "SIGAA_IDENTITY_INVALID"
  | "SIGAA_IDENTITY_MISMATCH"
  | "SIGAA_TIMEOUT"
  | "SIGAA_UNAVAILABLE"
  | "SIGAA_RESPONSE_INVALID"
  | "CONNECTOR_UNAVAILABLE"
  | "CONNECTOR_MISCONFIGURED"
  | "COURSE_MISMATCH"
  | "LEASE_LOST"
  | "INTERNAL_ERROR";

export type SigaaRunReceipt = Readonly<{
  id: SigaaRunId;
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "SUPERSEDED";
  failureCode: SigaaSyncFailureCode | null;
  connectorRequestId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}>;

export type RateLimitDecision =
  | Readonly<{ kind: "allowed"; remaining: number; resetAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>;

export type LeaseGrant = Readonly<{
  runId: SigaaRunId;
  generation: bigint;
  secret: LeaseSecret;
  expiresAt: Date;
  courseIdentityToken: string;
  expectedMatricula: Matricula | null;
}>;

export type ReserveAttemptResult =
  | Readonly<{ kind: "reserved"; lease: LeaseGrant }>
  | Readonly<{ kind: "replay"; run: SigaaRunReceipt }>
  | Readonly<{ kind: "busy"; retryAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>;

export type CommitLatestResult =
  | Readonly<{ kind: "committed"; run: SigaaRunReceipt; synchronizedAt: Date }>
  | Readonly<{
      kind: "rejected";
      run: SigaaRunReceipt;
      failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH" | "LEASE_LOST";
    }>;

export type ImportedAcademicState = Readonly<{
  matricula: Readonly<{
    value: string | null;
    origin: "LEGACY" | "MANUAL" | "SIGAA" | null;
    verifiedAt: Date | null;
  }>;
  connection: Readonly<{
    status: "PENDING" | "CONNECTED" | "DISCONNECTED";
    consentVersion: string | null;
    consentedAt: Date | null;
    connectedAt: Date | null;
    disconnectedAt: Date | null;
  }> | null;
  snapshot: Readonly<{
    contractVersion: string;
    connectorObservedAt: Date;
    synchronizedAt: Date;
    upstreamCommit: string;
    installedByRunId: string | null;
    payload: SigaaAcademicSnapshotPayload;
  }> | null;
}>;

export type DisconnectResult =
  | Readonly<{ kind: "disconnected"; disconnectedAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>;

export type DeleteImportedDataResult =
  | Readonly<{ kind: "deleted"; hadImportedData: boolean; matriculaCleared: boolean }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>;

export type ISigaaRepository = {
  consumeRateLimit(input: {
    ownerId: UsuarioId;
    operation: SigaaRateLimitOperation;
  }): Promise<RateLimitDecision>;

  reserveAttempt(input: {
    ownerId: UsuarioId;
    idempotencyKey: IdempotencyKey;
    consentVersion: string;
  }): Promise<ReserveAttemptResult>;

  commitLatest(input: {
    ownerId: UsuarioId;
    lease: LeaseGrant;
    candidate: SigaaSnapshotCandidate;
  }): Promise<CommitLatestResult>;

  finishAttempt(input: {
    ownerId: UsuarioId;
    lease: LeaseGrant;
    failure: SigaaSyncFailureCode;
    connectorRequestId?: string;
  }): Promise<SigaaRunReceipt>;

  readImportedState(ownerId: UsuarioId): Promise<ImportedAcademicState>;
  disconnect(ownerId: UsuarioId): Promise<DisconnectResult>;
  deleteImportedData(ownerId: UsuarioId): Promise<DeleteImportedDataResult>;
  deleteExpiredRuns(): Promise<{ deleted: number }>;
};
