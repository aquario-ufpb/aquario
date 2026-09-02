import type { SigaaAccessState } from "../access-state";
import {
  decideSigaaConnectNudge,
  getSigaaConnectNudgeConnectionState,
  readSigaaConnectNudgeDismissed,
  sigaaConnectNudgeStorageKey,
  writeSigaaConnectNudgeDismissed,
  type SigaaConnectNudgeInput,
  type SigaaConnectNudgeStorage,
} from "../connect-nudge";

const neverConnected: SigaaAccessState = {
  availability: "available",
  connection: { status: "ready", view: { kind: "never_connected" } },
};

const disconnected: SigaaAccessState = {
  availability: "available",
  connection: {
    status: "ready",
    view: { kind: "disconnected", synchronizedAt: "2026-08-01T00:00:00.000Z" },
  },
};

function readyInput(overrides: Partial<SigaaConnectNudgeInput> = {}): SigaaConnectNudgeInput {
  return {
    auth: { isAuthenticated: true, isLoading: false },
    onboarding: { shouldShow: false, isLoading: false },
    accessState: neverConnected,
    pathname: "/",
    dismissed: false,
    ...overrides,
  };
}

describe("decideSigaaConnectNudge", () => {
  it("shows for a signed-in user who finished onboarding and never connected", () => {
    expect(decideSigaaConnectNudge(readyInput())).toEqual({ show: true });
  });

  it("shows after a disconnect", () => {
    expect(decideSigaaConnectNudge(readyInput({ accessState: disconnected }))).toEqual({
      show: true,
    });
  });

  it("hides while auth is loading", () => {
    expect(
      decideSigaaConnectNudge(readyInput({ auth: { isAuthenticated: false, isLoading: true } }))
    ).toEqual({ show: false, reason: "loading" });
  });

  it("hides when the user is signed out", () => {
    expect(
      decideSigaaConnectNudge(readyInput({ auth: { isAuthenticated: false, isLoading: false } }))
    ).toEqual({ show: false, reason: "auth" });
  });

  it("hides while onboarding metadata is loading", () => {
    expect(
      decideSigaaConnectNudge(readyInput({ onboarding: { shouldShow: false, isLoading: true } }))
    ).toEqual({ show: false, reason: "loading" });
  });

  it("hides while onboarding is still open", () => {
    expect(
      decideSigaaConnectNudge(readyInput({ onboarding: { shouldShow: true, isLoading: false } }))
    ).toEqual({ show: false, reason: "onboarding" });
  });

  it("hides while SIGAA availability is checking", () => {
    expect(
      decideSigaaConnectNudge(readyInput({ accessState: { availability: "checking" } }))
    ).toEqual({ show: false, reason: "loading" });
  });

  it("never treats sign_in_required as a connect nudge", () => {
    expect(
      decideSigaaConnectNudge(
        readyInput({
          auth: { isAuthenticated: true, isLoading: false },
          accessState: { availability: "sign_in_required" },
        })
      )
    ).toEqual({ show: false, reason: "auth" });
  });

  it("hides while the SIGAA connection is checking", () => {
    expect(
      decideSigaaConnectNudge(
        readyInput({
          accessState: { availability: "available", connection: { status: "checking" } },
        })
      )
    ).toEqual({ show: false, reason: "loading" });
  });

  it("hides when the SIGAA connection is in error", () => {
    expect(
      decideSigaaConnectNudge(
        readyInput({
          accessState: { availability: "available", connection: { status: "error" } },
        })
      )
    ).toEqual({ show: false, reason: "unavailable" });
  });

  it("hides when the SIGAA connection is pending", () => {
    expect(
      decideSigaaConnectNudge(
        readyInput({
          accessState: {
            availability: "available",
            connection: { status: "ready", view: { kind: "pending" } },
          },
        })
      )
    ).toEqual({ show: false, reason: "unavailable" });
  });

  it("hides when SIGAA is already connected", () => {
    expect(
      decideSigaaConnectNudge(
        readyInput({
          accessState: {
            availability: "available",
            connection: {
              status: "ready",
              view: {
                kind: "connected",
                synchronizedAt: "2026-08-01T00:00:00.000Z",
                matricula: "20210000000",
              },
            },
          },
        })
      )
    ).toEqual({ show: false, reason: "connected" });
  });

  it.each(["/login", "/registro", "/esqueci-senha", "/resetar-senha", "/verificar-email"])(
    "hides on the auth route %s",
    pathname => {
      expect(decideSigaaConnectNudge(readyInput({ pathname }))).toEqual({
        show: false,
        reason: "route",
      });
    }
  );

  it("hides on /me/academico and its prefixes", () => {
    expect(decideSigaaConnectNudge(readyInput({ pathname: "/me/academico" }))).toEqual({
      show: false,
      reason: "route",
    });
    expect(decideSigaaConnectNudge(readyInput({ pathname: "/me/academico/historico" }))).toEqual({
      show: false,
      reason: "route",
    });
  });

  it("hides after the user dismissed the nudge", () => {
    expect(decideSigaaConnectNudge(readyInput({ dismissed: true }))).toEqual({
      show: false,
      reason: "dismissed",
    });
  });
});

describe("getSigaaConnectNudgeConnectionState", () => {
  it("returns the ready disconnected or never-connected kind", () => {
    expect(getSigaaConnectNudgeConnectionState(neverConnected)).toBe("never_connected");
    expect(getSigaaConnectNudgeConnectionState(disconnected)).toBe("disconnected");
  });

  it("returns null when the connection is not eligible", () => {
    expect(getSigaaConnectNudgeConnectionState({ availability: "checking" })).toBeNull();
    expect(getSigaaConnectNudgeConnectionState({ availability: "sign_in_required" })).toBeNull();
  });
});

describe("sigaa connect nudge storage", () => {
  function memoryStorage(initial: Record<string, string> = {}): SigaaConnectNudgeStorage & {
    store: Record<string, string>;
  } {
    const store = { ...initial };
    return {
      store,
      getItem(key) {
        return store[key] ?? null;
      },
      setItem(key, value) {
        store[key] = value;
      },
    };
  }

  it("versions the key per user", () => {
    expect(sigaaConnectNudgeStorageKey("user-1")).toBe("sigaa-connect-nudge:v1:user-1");
  });

  it("reads a stored dismissal", () => {
    const storage = memoryStorage({
      "sigaa-connect-nudge:v1:user-1": JSON.stringify({ dismissedAt: "2026-09-02T12:00:00.000Z" }),
    });

    expect(readSigaaConnectNudgeDismissed("user-1", storage)).toBe(true);
    expect(readSigaaConnectNudgeDismissed("user-2", storage)).toBe(false);
  });

  it("writes a dismissal that later reads as dismissed", () => {
    const storage = memoryStorage();
    writeSigaaConnectNudgeDismissed("user-1", "2026-09-02T12:00:00.000Z", storage);

    expect(storage.store["sigaa-connect-nudge:v1:user-1"]).toBe(
      JSON.stringify({ dismissedAt: "2026-09-02T12:00:00.000Z" })
    );
    expect(readSigaaConnectNudgeDismissed("user-1", storage)).toBe(true);
  });

  it("treats invalid or missing payloads as not dismissed", () => {
    const storage = memoryStorage({
      "sigaa-connect-nudge:v1:user-1": "{not-json",
      "sigaa-connect-nudge:v1:user-2": JSON.stringify({ dismissedAt: 12 }),
      "sigaa-connect-nudge:v1:user-3": JSON.stringify({ dismissedAt: "" }),
    });

    expect(readSigaaConnectNudgeDismissed("user-1", storage)).toBe(false);
    expect(readSigaaConnectNudgeDismissed("user-2", storage)).toBe(false);
    expect(readSigaaConnectNudgeDismissed("user-3", storage)).toBe(false);
    expect(readSigaaConnectNudgeDismissed("user-4", storage)).toBe(false);
  });

  it("swallows getItem and setItem failures", () => {
    const throwingStorage: SigaaConnectNudgeStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };

    expect(readSigaaConnectNudgeDismissed("user-1", throwingStorage)).toBe(false);
    expect(() =>
      writeSigaaConnectNudgeDismissed("user-1", undefined, throwingStorage)
    ).not.toThrow();
  });

  it("treats a missing storage adapter as not dismissed", () => {
    expect(readSigaaConnectNudgeDismissed("user-1", null)).toBe(false);
    expect(() => writeSigaaConnectNudgeDismissed("user-1", undefined, null)).not.toThrow();
  });
});
