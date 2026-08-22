import { ErrorCode } from "@/lib/shared/errors";

import { synchronizeOwnSigaa } from "../sigaa";
import { tokenManager } from "../token-manager";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
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
});
