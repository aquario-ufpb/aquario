import { isAuthRoute } from "@/lib/client/auth-routes";
import type { SigaaAccessState } from "@/lib/client/sigaa/access-state";

export type SigaaConnectNudgeHideReason =
  | "auth"
  | "loading"
  | "onboarding"
  | "connected"
  | "route"
  | "dismissed"
  | "unavailable";

export type SigaaConnectNudgeDecision =
  | { show: false; reason: SigaaConnectNudgeHideReason }
  | { show: true };

export type SigaaConnectNudgeInput = Readonly<{
  auth: Readonly<{ isAuthenticated: boolean; isLoading: boolean }>;
  onboarding: Readonly<{ shouldShow: boolean; isLoading: boolean }>;
  accessState: SigaaAccessState;
  pathname: string;
  dismissed: boolean;
}>;

export type SigaaConnectNudgeConnectionState = "never_connected" | "disconnected";

export type SigaaConnectNudgeDismissal = Readonly<{ dismissedAt: string }>;

export type SigaaConnectNudgeStorage = Pick<Storage, "getItem" | "setItem">;

export const SIGAA_CONNECT_NUDGE_STORAGE_VERSION = "v1";

export function sigaaConnectNudgeStorageKey(userId: string): string {
  return `sigaa-connect-nudge:${SIGAA_CONNECT_NUDGE_STORAGE_VERSION}:${userId}`;
}

export function isSigaaAcademicRoute(pathname: string): boolean {
  return pathname === "/me/academico" || pathname.startsWith("/me/academico/");
}

export function decideSigaaConnectNudge(input: SigaaConnectNudgeInput): SigaaConnectNudgeDecision {
  if (input.auth.isLoading) {
    return { show: false, reason: "loading" };
  }

  if (!input.auth.isAuthenticated) {
    return { show: false, reason: "auth" };
  }

  if (input.onboarding.isLoading) {
    return { show: false, reason: "loading" };
  }

  if (input.onboarding.shouldShow) {
    return { show: false, reason: "onboarding" };
  }

  const eligibility = resolveSigaaNudgeEligibility(input.accessState);
  if (!eligibility.eligible) {
    return { show: false, reason: eligibility.reason };
  }

  if (isAuthRoute(input.pathname) || isSigaaAcademicRoute(input.pathname)) {
    return { show: false, reason: "route" };
  }

  if (input.dismissed) {
    return { show: false, reason: "dismissed" };
  }

  return { show: true };
}

export function getSigaaConnectNudgeConnectionState(
  accessState: SigaaAccessState
): SigaaConnectNudgeConnectionState | null {
  const eligibility = resolveSigaaNudgeEligibility(accessState);
  return eligibility.eligible ? eligibility.connectionState : null;
}

export function readSigaaConnectNudgeDismissed(
  userId: string,
  storage: SigaaConnectNudgeStorage | null = getLocalStorage()
): boolean {
  if (!storage) {
    return false;
  }

  try {
    const raw = storage.getItem(sigaaConnectNudgeStorageKey(userId));
    if (!raw) {
      return false;
    }
    return parseDismissal(raw) !== null;
  } catch {
    return false;
  }
}

export function writeSigaaConnectNudgeDismissed(
  userId: string,
  dismissedAt: string = new Date().toISOString(),
  storage: SigaaConnectNudgeStorage | null = getLocalStorage()
): void {
  if (!storage) {
    return;
  }

  try {
    const value: SigaaConnectNudgeDismissal = { dismissedAt };
    storage.setItem(sigaaConnectNudgeStorageKey(userId), JSON.stringify(value));
  } catch {
    return;
  }
}

type SigaaNudgeEligibility =
  | {
      eligible: false;
      reason: Extract<
        SigaaConnectNudgeHideReason,
        "auth" | "loading" | "connected" | "unavailable"
      >;
    }
  | { eligible: true; connectionState: SigaaConnectNudgeConnectionState };

function resolveSigaaNudgeEligibility(accessState: SigaaAccessState): SigaaNudgeEligibility {
  if (accessState.availability === "checking") {
    return { eligible: false, reason: "loading" };
  }

  if (accessState.availability === "sign_in_required") {
    return { eligible: false, reason: "auth" };
  }

  if (accessState.connection.status === "checking") {
    return { eligible: false, reason: "loading" };
  }

  if (accessState.connection.status === "error") {
    return { eligible: false, reason: "unavailable" };
  }

  const view = accessState.connection.view;
  switch (view.kind) {
    case "never_connected":
    case "disconnected":
      return { eligible: true, connectionState: view.kind };
    case "connected":
      return { eligible: false, reason: "connected" };
    case "pending":
      return { eligible: false, reason: "unavailable" };
    default: {
      const _exhaustive: never = view;
      return _exhaustive;
    }
  }
}

function parseDismissal(raw: string): SigaaConnectNudgeDismissal | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || !("dismissedAt" in parsed)) {
    return null;
  }

  const dismissedAt = parsed.dismissedAt;
  if (typeof dismissedAt !== "string" || dismissedAt.length === 0) {
    return null;
  }

  return { dismissedAt };
}

function getLocalStorage(): SigaaConnectNudgeStorage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}
