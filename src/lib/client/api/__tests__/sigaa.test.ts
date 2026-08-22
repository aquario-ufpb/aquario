import { ErrorCode } from "@/lib/shared/errors";

import { confirmOwnSigaaCourseChange, synchronizeOwnSigaa } from "../sigaa";
import { tokenManager } from "../token-manager";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function response(status: number, body: unknown): Response {
  const result = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    clone: () => result,
  } as Response;
  return result;
}

function input() {
  return {
    username: "test-student",
    password: "test-only-password",
    proofToken: "short-lived-test-proof",
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
  };
}

describe("synchronizeOwnSigaa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenManager.clear();
    tokenManager.setToken("aquario-token");
  });

  afterEach(() => tokenManager.clear());

  it.each([401, 307, 308])("never retries or follows an HTTP %i response", async status => {
    mockFetch.mockResolvedValueOnce(
      response(status, { message: "Falha segura", code: ErrorCode.SIGAA_AUTH_FAILED })
    );

    await expect(synchronizeOwnSigaa(input())).rejects.toBeDefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      method: "POST",
      cache: "no-store",
      redirect: "error",
    });
  });

  it("fails before fetch without the ordinary Aquário bearer", async () => {
    tokenManager.clear();

    await expect(synchronizeOwnSigaa(input())).rejects.toMatchObject({
      code: ErrorCode.TOKEN_MISSING,
      status: 401,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("strictly parses the SIGAA mismatch before the generic ApiError", async () => {
    mockFetch.mockResolvedValueOnce(
      response(409, {
        message: "Curso divergente",
        code: ErrorCode.SIGAA_COURSE_MISMATCH,
        resolution: "confirmation_required",
        proposalId: "550e8400-e29b-41d4-a716-446655440010",
        expiresAt: "2026-08-21T12:10:00.000Z",
        currentCourse: "Ciência da Computação",
        sigaaCourse: "Engenharia de Computação - Graduação",
        targetCourse: "Engenharia da Computação",
      })
    );

    await expect(synchronizeOwnSigaa(input())).rejects.toEqual(
      expect.objectContaining({
        name: "SigaaCourseChangeRequiredError",
        mismatch: expect.objectContaining({ targetCourse: "Engenharia da Computação" }),
      })
    );
  });

  it.each(["RUNNING", "FAILED", "SUPERSEDED"] as const)(
    "rejects an HTTP-200 normal replay whose run is %s",
    async status => {
      mockFetch.mockResolvedValueOnce(
        response(200, {
          status: "replay",
          run: {
            id: "550e8400-e29b-41d4-a716-446655440010",
            status,
            failureCode: status === "FAILED" ? "SIGAA_AUTH_FAILED" : null,
            connectorRequestId: null,
            startedAt: "2026-08-21T11:59:00.000Z",
            finishedAt: status === "RUNNING" ? null : "2026-08-21T12:00:00.000Z",
          },
        })
      );

      await expect(synchronizeOwnSigaa(input())).rejects.toMatchObject({
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  );

  it("uses a separate no-retry confirmation operation", async () => {
    mockFetch.mockResolvedValueOnce(
      response(200, {
        status: "synchronized",
        synchronizedAt: "2026-08-21T12:00:00.000Z",
        courseReplaced: true,
        run: {
          id: "550e8400-e29b-41d4-a716-446655440010",
          status: "SUCCEEDED",
          failureCode: null,
          connectorRequestId: "request-id",
          startedAt: "2026-08-21T11:59:00.000Z",
          finishedAt: "2026-08-21T12:00:00.000Z",
        },
      })
    );

    await confirmOwnSigaaCourseChange({
      ...input(),
      proposalId: "550e8400-e29b-41d4-a716-446655440011",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/usuarios/me/sigaa/course-change/confirm");
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ redirect: "error", cache: "no-store" });
  });

  it("parses a stale confirmation before the generic API error", async () => {
    mockFetch.mockResolvedValueOnce(
      response(409, {
        message: "A proposta de substituição de curso não é mais válida.",
        code: ErrorCode.SIGAA_COURSE_MISMATCH,
        resolution: "stale",
      })
    );

    await expect(
      confirmOwnSigaaCourseChange({
        ...input(),
        proposalId: "550e8400-e29b-41d4-a716-446655440011",
      })
    ).rejects.toMatchObject({ name: "SigaaCourseChangeInvalidError" });
  });
});
