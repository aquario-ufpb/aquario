/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

const mockWithAuth = jest.fn();
const mockReadImportedState = jest.fn();
const mockDisconnect = jest.fn();
const mockDeleteImportedData = jest.fn();
const mockReserveAttempt = jest.fn();
const mockReserveCourseChangeConfirmation = jest.fn();
const mockConnectorSynchronize = jest.fn();

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (...args: unknown[]) => mockWithAuth(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    sigaaRepository: {
      readImportedState: (...args: unknown[]) => mockReadImportedState(...args),
      disconnect: (...args: unknown[]) => mockDisconnect(...args),
      deleteImportedData: (...args: unknown[]) => mockDeleteImportedData(...args),
      reserveAttempt: (...args: unknown[]) => mockReserveAttempt(...args),
      reserveCourseChangeConfirmation: (...args: unknown[]) =>
        mockReserveCourseChangeConfirmation(...args),
    },
  }),
}));

jest.mock("@/lib/server/services/sigaa/create-connector", () => ({
  createSigaaConnectorFromEnvironment: () => ({
    synchronize: (...args: unknown[]) => mockConnectorSynchronize(...args),
  }),
}));

import { GET as getAcademicState } from "../../academico/route";
import { DELETE as deleteImportedData } from "../data/route";
import { POST as disconnect } from "../disconnect/route";
import { POST as synchronize } from "../sync/route";
import { POST as confirmCourseChange } from "../course-change/confirm/route";
import { createSigaaReauthProofService } from "@/lib/server/services/sigaa/reauth";

const OWNER_ID = "550e8400-e29b-41d4-a716-446655440000";
const REAUTH_SECRET = "private-route-test-reauth-secret-long-enough";
const PROOF = createSigaaReauthProofService(REAUTH_SECRET, {
  createJti: () => "550e8400-e29b-41d4-a716-446655440001",
}).issueProof(OWNER_ID).proofToken;

function request(path: string, method: string, body?: unknown, proof = PROOF): Request {
  return new Request(`http://localhost/api${path}`, {
    method,
    headers: {
      Authorization: "Bearer normal-aquario-jwt",
      "X-Sigaa-Reauth-Token": proof,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("private SIGAA route exports", () => {
  const originalSecret = process.env.SIGAA_REAUTH_JWT_SECRET;

  beforeAll(() => {
    process.env.SIGAA_REAUTH_JWT_SECRET = REAUTH_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.SIGAA_REAUTH_JWT_SECRET;
    } else {
      process.env.SIGAA_REAUTH_JWT_SECRET = originalSecret;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithAuth.mockImplementation((incomingRequest, handler) =>
      handler(incomingRequest, { id: OWNER_ID, permissoes: ["sigaa:beta"] })
    );
  });

  it("derives the academic-state owner from auth and marks the response private", async () => {
    mockReadImportedState.mockResolvedValue({
      matricula: { value: null, origin: null, verifiedAt: null },
      connection: null,
      snapshot: null,
    });

    const response = await getAcademicState(request("/usuarios/me/academico", "GET"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockReadImportedState).toHaveBeenCalledWith(OWNER_ID);
  });

  it("derives the disconnect owner from auth and preserves private caching", async () => {
    const disconnectedAt = new Date("2026-08-21T15:01:00.000Z");
    mockDisconnect.mockResolvedValue({ kind: "disconnected", disconnectedAt });

    const response = await disconnect(request("/usuarios/me/sigaa/disconnect", "POST"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockDisconnect).toHaveBeenCalledWith(OWNER_ID);
  });

  it("derives the deletion owner from auth and exposes no user-id parameter", async () => {
    mockDeleteImportedData.mockResolvedValue({
      kind: "deleted",
      hadImportedData: true,
      matriculaCleared: true,
    });

    const response = await deleteImportedData(request("/usuarios/me/sigaa/data", "DELETE"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockDeleteImportedData).toHaveBeenCalledWith(OWNER_ID);
  });

  it("reserves a sync for the authenticated owner without accepting a connector URL", async () => {
    const run = {
      id: "550e8400-e29b-41d4-a716-446655440003",
      status: "SUCCEEDED",
      failureCode: null,
      connectorRequestId: "a".repeat(32),
      startedAt: new Date("2026-08-21T15:00:00.000Z"),
      finishedAt: new Date("2026-08-21T15:02:00.000Z"),
    };
    mockReserveAttempt.mockResolvedValue({ kind: "replay", run });

    const response = await synchronize(
      request("/usuarios/me/sigaa/sync", "POST", {
        username: "test-user",
        password: "test-password",
        idempotencyKey: "550e8400-e29b-41d4-a716-446655440002",
        consentVersion: "sigaa-v1-2026-08",
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockReserveAttempt).toHaveBeenCalledWith({
      ownerId: OWNER_ID,
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440002",
      consentVersion: "sigaa-v1-2026-08",
    });
    expect(mockConnectorSynchronize).not.toHaveBeenCalled();
  });

  it("does not turn a failed same-key normal run into HTTP 200", async () => {
    mockReserveAttempt.mockResolvedValue({
      kind: "failed",
      failure: "SIGAA_AUTH_FAILED",
      run: {
        id: "550e8400-e29b-41d4-a716-446655440003",
        status: "FAILED",
        failureCode: "SIGAA_AUTH_FAILED",
        connectorRequestId: null,
        startedAt: new Date("2026-08-21T15:00:00.000Z"),
        finishedAt: new Date("2026-08-21T15:01:00.000Z"),
      },
    });

    const response = await synchronize(
      request("/usuarios/me/sigaa/sync", "POST", {
        username: "test-user",
        password: "test-password",
        idempotencyKey: "550e8400-e29b-41d4-a716-446655440002",
        consentVersion: "sigaa-v1-2026-08",
      })
    );

    expect(response.status).toBe(401);
    expect(mockConnectorSynchronize).not.toHaveBeenCalled();
  });

  it("blocks an invalid course-change proposal before calling the connector", async () => {
    mockReserveCourseChangeConfirmation.mockResolvedValue({
      kind: "blocked",
      reason: "proposal_invalid",
    });

    const proposalId = "550e8400-e29b-41d4-a716-446655440009";
    const boundProof = createSigaaReauthProofService(REAUTH_SECRET).issueProof(
      OWNER_ID,
      proposalId
    ).proofToken;
    const response = await confirmCourseChange(
      request(
        "/usuarios/me/sigaa/course-change/confirm",
        "POST",
        {
          proposalId,
          username: "fresh-user",
          password: "fresh-password",
          idempotencyKey: "550e8400-e29b-41d4-a716-446655440008",
          consentVersion: "sigaa-v1-2026-08",
        },
        boundProof
      )
    );

    expect(response.status).toBe(409);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockReserveCourseChangeConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: OWNER_ID,
        proposalId,
        proofProposalId: proposalId,
      })
    );
    expect(mockConnectorSynchronize).not.toHaveBeenCalled();
  });
});
