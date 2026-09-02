/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

import type { ISigaaRepository } from "@/lib/server/db/interfaces/sigaa-repository.interface";
import {
  leaseSecretSchema,
  matriculaSchema,
  sigaaRunIdSchema,
  sigaaSnapshotCandidateSchema,
  type SigaaSnapshotCandidate,
} from "@/lib/server/services/sigaa/storage.types";

import { SigaaConnectorError, type ISigaaConnector } from "../connector";
import { confirmOwnCourseChange } from "../confirm-own-course-change";
import { synchronizeOwnAcademicData } from "../synchronize-own-academic-data";

const OWNER_ID = "550e8400-e29b-41d4-a716-446655440000";
const RUN_ID = sigaaRunIdSchema.parse("550e8400-e29b-41d4-a716-446655440001");
const IDEMPOTENCY_KEY = "550e8400-e29b-41d4-a716-446655440002";
const STARTED_AT = new Date("2026-08-21T15:00:00.000Z");
const FINISHED_AT = new Date("2026-08-21T15:00:02.000Z");

const lease = {
  runId: RUN_ID,
  generation: BigInt(1),
  secret: leaseSecretSchema.parse("a".repeat(64)),
  expiresAt: new Date("2026-08-21T15:04:00.000Z"),
  courseIdentityToken: "course-token",
  expectedMatricula: matriculaSchema.parse("20260000001"),
};

const runningRun = {
  id: RUN_ID,
  status: "RUNNING" as const,
  failureCode: null,
  connectorRequestId: null,
  startedAt: STARTED_AT,
  finishedAt: null,
};

const succeededRun = {
  ...runningRun,
  status: "SUCCEEDED" as const,
  connectorRequestId: "b".repeat(32),
  finishedAt: FINISHED_AT,
};

function candidate(): SigaaSnapshotCandidate {
  return sigaaSnapshotCandidateSchema.parse({
    contractVersion: "1.0",
    connectorObservedAt: STARTED_AT,
    connectorRequestId: "b".repeat(32),
    upstreamCommit: "c".repeat(40),
    identity: {
      matricula: "20260000001",
      sourceCourse: "Ciência da Computação",
      sourceSemester: "2026.1",
    },
    curriculum: {
      code: "162024",
      maximumCompletionTerm: "2031.2",
      semesterWorkload: { minimum: 240, maximum: 480 },
      cra: { value: "8.50", source: "academic_transcript" },
      progress: [],
      components: [],
    },
    grades: [],
    classes: [],
  });
}

function repository(): jest.Mocked<ISigaaRepository> {
  return {
    consumeRateLimit: jest.fn(),
    reserveAttempt: jest.fn().mockResolvedValue({ kind: "reserved", lease }),
    commitLatest: jest.fn(),
    reserveCourseChangeConfirmation: jest.fn(),
    commitCourseChange: jest.fn(),
    finishAttempt: jest.fn(),
    readImportedState: jest.fn(),
    disconnect: jest.fn(),
    deleteImportedData: jest.fn(),
    deleteExpiredRuns: jest.fn(),
  };
}

function input() {
  return {
    ownerId: OWNER_ID,
    username: "test-user",
    password: "test-only-password",
    idempotencyKey: IDEMPOTENCY_KEY,
    consentVersion: "sigaa-v1-2026-08",
  };
}

describe("synchronizeOwnAcademicData", () => {
  it("reserves before the network and commits the validated candidate", async () => {
    const repo = repository();
    const connector: jest.Mocked<ISigaaConnector> = {
      synchronize: jest.fn().mockResolvedValue(candidate()),
    };
    repo.commitLatest.mockResolvedValue({
      kind: "committed",
      run: succeededRun,
      synchronizedAt: FINISHED_AT,
    });

    const result = await synchronizeOwnAcademicData(input(), { repository: repo, connector });

    expect(result).toEqual({
      kind: "synchronized",
      run: succeededRun,
      synchronizedAt: FINISHED_AT,
    });
    expect(repo.reserveAttempt.mock.invocationCallOrder[0]).toBeLessThan(
      connector.synchronize.mock.invocationCallOrder[0]
    );
    expect(connector.synchronize).toHaveBeenCalledWith({
      credentials: expect.any(Object),
      expectedMatricula: "20260000001",
    });
    expect(repo.commitLatest).toHaveBeenCalledWith({
      ownerId: OWNER_ID,
      lease,
      candidate: candidate(),
    });
    expect(repo.finishAttempt).not.toHaveBeenCalled();
  });

  it("returns an idempotent replay without constructing a connector request", async () => {
    const repo = repository();
    const connector: jest.Mocked<ISigaaConnector> = { synchronize: jest.fn() };
    repo.reserveAttempt.mockResolvedValue({ kind: "replay", run: succeededRun });

    const result = await synchronizeOwnAcademicData(input(), { repository: repo, connector });

    expect(result).toEqual({ kind: "replay", run: succeededRun });
    expect(connector.synchronize).not.toHaveBeenCalled();
    expect(repo.commitLatest).not.toHaveBeenCalled();
  });

  it("persists a closed connector failure with its safe request id", async () => {
    const repo = repository();
    const failureRun = {
      ...runningRun,
      status: "FAILED" as const,
      failureCode: "SIGAA_TIMEOUT" as const,
      connectorRequestId: "d".repeat(32),
      finishedAt: FINISHED_AT,
    };
    const connector: jest.Mocked<ISigaaConnector> = {
      synchronize: jest
        .fn()
        .mockRejectedValue(new SigaaConnectorError("SIGAA_TIMEOUT", "d".repeat(32))),
    };
    repo.finishAttempt.mockResolvedValue(failureRun);

    const result = await synchronizeOwnAcademicData(input(), { repository: repo, connector });

    expect(result).toEqual({ kind: "failed", run: failureRun, failure: "SIGAA_TIMEOUT" });
    expect(repo.finishAttempt).toHaveBeenCalledWith({
      ownerId: OWNER_ID,
      lease,
      failure: "SIGAA_TIMEOUT",
      connectorRequestId: "d".repeat(32),
    });
    expect(repo.commitLatest).not.toHaveBeenCalled();
  });

  it("persists an internal code without retaining an unknown error", async () => {
    const repo = repository();
    const failureRun = {
      ...runningRun,
      status: "FAILED" as const,
      failureCode: "INTERNAL_ERROR" as const,
      finishedAt: FINISHED_AT,
    };
    const connector: jest.Mocked<ISigaaConnector> = {
      synchronize: jest.fn().mockRejectedValue(new Error("database and credential detail")),
    };
    repo.finishAttempt.mockResolvedValue(failureRun);

    const result = await synchronizeOwnAcademicData(input(), { repository: repo, connector });

    expect(result).toEqual({ kind: "failed", run: failureRun, failure: "INTERNAL_ERROR" });
    expect(repo.finishAttempt).toHaveBeenCalledWith({
      ownerId: OWNER_ID,
      lease,
      failure: "INTERNAL_ERROR",
    });
  });
});

describe("confirmOwnCourseChange", () => {
  const confirmationInput = () => ({
    ...input(),
    proposalId: "550e8400-e29b-41d4-a716-446655440010",
    proofProposalId: "550e8400-e29b-41d4-a716-446655440010",
  });

  it("blocks an invalid proposal before connector work", async () => {
    const repo = repository();
    const connector: jest.Mocked<ISigaaConnector> = { synchronize: jest.fn() };
    repo.reserveCourseChangeConfirmation.mockResolvedValue({
      kind: "blocked",
      reason: "proposal_invalid",
    });

    const result = await confirmOwnCourseChange(confirmationInput(), {
      repository: repo,
      connector,
    });

    expect(result).toEqual({ kind: "blocked", reason: "proposal_invalid" });
    expect(connector.synchronize).not.toHaveBeenCalled();
    expect(repo.commitCourseChange).not.toHaveBeenCalled();
  });

  it("replays the same idempotency key without another connector call", async () => {
    const repo = repository();
    const connector: jest.Mocked<ISigaaConnector> = { synchronize: jest.fn() };
    repo.reserveCourseChangeConfirmation.mockResolvedValue({
      kind: "replay",
      run: succeededRun,
      courseReplaced: true,
    });

    const result = await confirmOwnCourseChange(confirmationInput(), {
      repository: repo,
      connector,
    });

    expect(result).toEqual({ kind: "replay", run: succeededRun, courseReplaced: true });
    expect(connector.synchronize).not.toHaveBeenCalled();
  });

  it("calls SIGAA again and commits the fresh candidate", async () => {
    const repo = repository();
    const connector: jest.Mocked<ISigaaConnector> = {
      synchronize: jest.fn().mockResolvedValue(candidate()),
    };
    repo.reserveCourseChangeConfirmation.mockResolvedValue({
      kind: "reserved",
      lease,
      proposalId: confirmationInput().proposalId,
    });
    repo.commitCourseChange.mockResolvedValue({
      kind: "committed",
      run: succeededRun,
      synchronizedAt: FINISHED_AT,
      courseReplaced: true,
    });

    const result = await confirmOwnCourseChange(confirmationInput(), {
      repository: repo,
      connector,
    });

    expect(connector.synchronize).toHaveBeenCalledWith({
      credentials: expect.any(Object),
      expectedMatricula: "20260000001",
    });
    expect(repo.commitCourseChange).toHaveBeenCalledWith({
      ownerId: OWNER_ID,
      proposalId: confirmationInput().proposalId,
      lease,
      candidate: candidate(),
    });
    expect(result).toEqual({
      kind: "synchronized",
      run: succeededRun,
      synchronizedAt: FINISHED_AT,
      courseReplaced: true,
    });
  });
});
