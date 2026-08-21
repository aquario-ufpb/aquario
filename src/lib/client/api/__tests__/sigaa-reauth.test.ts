/* eslint-disable require-await */
import { ErrorCode } from "@/lib/shared/errors";

import { reauthenticateForSigaa } from "../sigaa-reauth";
import { tokenManager } from "../token-manager";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("reauthenticateForSigaa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenManager.clear();
    tokenManager.setToken("aquario-token");
  });

  afterEach(() => {
    tokenManager.clear();
  });

  it("uses one direct no-store fetch with the current bearer", async () => {
    mockFetch.mockResolvedValueOnce(
      response(200, {
        proofToken: "sigaa-proof",
        expiresAt: "2026-08-21T15:15:00.000Z",
      })
    );

    await expect(reauthenticateForSigaa("aquario-password")).resolves.toEqual({
      proofToken: "sigaa-proof",
      expiresAt: "2026-08-21T15:15:00.000Z",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/usuarios/me/sigaa/reauth", {
      method: "POST",
      cache: "no-store",
      redirect: "error",
      headers: {
        Authorization: "Bearer aquario-token",
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: "aquario-password" }),
    });
  });

  it.each([307, 308])("refuses a %i redirect without replaying the password", async status => {
    mockFetch.mockResolvedValueOnce(response(status, null));

    await expect(reauthenticateForSigaa("must-never-leave-this-origin")).rejects.toBeDefined();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ redirect: "error" });
  });

  it("does not refresh, retry, or replay the password body after a 401", async () => {
    mockFetch.mockResolvedValueOnce(
      response(401, {
        message: "Token inválido ou expirado",
        code: ErrorCode.TOKEN_INVALID,
      })
    );

    await expect(reauthenticateForSigaa("must-not-be-replayed")).rejects.toMatchObject({
      status: 401,
      code: ErrorCode.TOKEN_INVALID,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(String(mockFetch.mock.calls[0][0])).not.toContain("/auth/refresh");
  });

  it("fails before fetch when the normal Aquário token is absent", async () => {
    tokenManager.clear();

    await expect(reauthenticateForSigaa("password")).rejects.toMatchObject({
      status: 401,
      code: ErrorCode.TOKEN_MISSING,
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects a malformed success body", async () => {
    mockFetch.mockResolvedValueOnce(
      response(200, {
        proofToken: "sigaa-proof",
        expiresAt: "not-a-date",
        password: "unexpected",
      })
    );

    await expect(reauthenticateForSigaa("password")).rejects.toMatchObject({
      code: ErrorCode.INTERNAL_ERROR,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
