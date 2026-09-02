import { resolveSigaaAccessState } from "../access-state";

describe("resolveSigaaAccessState", () => {
  it("represents authentication bootstrap without guessing the user state", () => {
    expect(
      resolveSigaaAccessState({
        isAuthenticated: false,
        isAuthLoading: true,
        isConnectionLoading: false,
        isConnectionError: false,
      })
    ).toEqual({ availability: "checking" });
  });

  it("requires sign in only after authentication resolves", () => {
    expect(
      resolveSigaaAccessState({
        isAuthenticated: false,
        isAuthLoading: false,
        isConnectionLoading: false,
        isConnectionError: false,
      })
    ).toEqual({ availability: "sign_in_required" });
  });

  it("represents authenticated loading without scattered booleans", () => {
    expect(
      resolveSigaaAccessState({
        isAuthenticated: true,
        isAuthLoading: false,
        isConnectionLoading: true,
        isConnectionError: false,
      })
    ).toEqual({ availability: "available", connection: { status: "checking" } });
  });

  it("maps a resolved import into the integration view", () => {
    expect(
      resolveSigaaAccessState({
        isAuthenticated: true,
        isAuthLoading: false,
        isConnectionLoading: false,
        isConnectionError: false,
        importedState: {
          matricula: { value: null, origin: null, verifiedAt: null },
          connection: null,
          snapshot: null,
        },
      })
    ).toEqual({
      availability: "available",
      connection: { status: "ready", view: { kind: "never_connected" } },
    });
  });
});
