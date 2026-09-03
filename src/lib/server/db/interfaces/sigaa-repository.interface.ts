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

export type SigaaCourseChangeProposalView = Readonly<{
  proposalId: string;
  expiresAt: Date;
  currentCourse: string;
  sigaaCourse: string;
  targetCourse: string;
  currentCenter?: string;
  targetCenter?: string;
}>;

export type SigaaCourseResolution =
  | Readonly<{ kind: "matched_current" }>
  | Readonly<{ kind: "confirmation_required"; proposal: SigaaCourseChangeProposalView }>
  | Readonly<{
      kind: "blocked";
      reason: "source_missing" | "source_unrecognized" | "catalog_unavailable" | "profile_changed";
    }>
  | Readonly<{ kind: "stale" }>;

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
  | Readonly<{ kind: "course_resolution"; run: SigaaRunReceipt; resolution: SigaaCourseResolution }>
  | Readonly<{ kind: "failed"; run: SigaaRunReceipt; failure: SigaaSyncFailureCode }>
  | Readonly<{ kind: "busy"; retryAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>;

export type CommitLatestResult =
  | Readonly<{
      kind: "committed";
      run: SigaaRunReceipt;
      synchronizedAt: Date;
    }>
  | Readonly<{ kind: "course_resolution"; run: SigaaRunReceipt; resolution: SigaaCourseResolution }>
  | Readonly<{
      kind: "rejected";
      run: SigaaRunReceipt;
      failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH" | "LEASE_LOST";
    }>;

export type ReserveCourseChangeConfirmationResult =
  | Readonly<{ kind: "reserved"; lease: LeaseGrant; proposalId: string }>
  | Readonly<{ kind: "replay"; run: SigaaRunReceipt; courseReplaced: true }>
  | Readonly<{ kind: "busy"; retryAt: Date }>
  | Readonly<{ kind: "rate_limited"; retryAt: Date }>
  | Readonly<{ kind: "blocked"; reason: "proposal_invalid" | "reauth_proposal_mismatch" }>
  | Readonly<{ kind: "stale" }>;

export type CommitCourseChangeResult =
  | Readonly<{
      kind: "committed";
      run: SigaaRunReceipt;
      synchronizedAt: Date;
      courseReplaced: true;
    }>
  | Readonly<{
      kind: "rejected";
      run: SigaaRunReceipt;
      failure: "COURSE_MISMATCH" | "SIGAA_IDENTITY_MISMATCH" | "LEASE_LOST";
      resolution: SigaaCourseResolution;
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

  reserveCourseChangeConfirmation(input: {
    ownerId: UsuarioId;
    proposalId: string;
    proofProposalId: string | null;
    idempotencyKey: IdempotencyKey;
    consentVersion: string;
  }): Promise<ReserveCourseChangeConfirmationResult>;

  commitCourseChange(input: {
    ownerId: UsuarioId;
    proposalId: string;
    lease: LeaseGrant;
    candidate: SigaaSnapshotCandidate;
  }): Promise<CommitCourseChangeResult>;

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
