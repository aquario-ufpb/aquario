import type { SigaaImportedState } from "@/lib/client/api/sigaa";

import { toSigaaIntegrationView, type SigaaIntegrationView } from "./view-model";

export type SigaaAccessState =
  | Readonly<{ availability: "checking" }>
  | Readonly<{ availability: "sign_in_required" }>
  | Readonly<{
      availability: "available";
      connection:
        | Readonly<{ status: "checking" }>
        | Readonly<{ status: "error" }>
        | Readonly<{ status: "ready"; view: SigaaIntegrationView }>;
    }>;

type SigaaAccessStateInput = Readonly<{
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isConnectionLoading: boolean;
  isConnectionError: boolean;
  importedState?: SigaaImportedState;
}>;

export function resolveSigaaAccessState(input: SigaaAccessStateInput): SigaaAccessState {
  if (input.isAuthLoading) {
    return { availability: "checking" };
  }

  if (!input.isAuthenticated) {
    return { availability: "sign_in_required" };
  }

  if (input.isConnectionLoading) {
    return { availability: "available", connection: { status: "checking" } };
  }

  if (input.isConnectionError || !input.importedState) {
    return { availability: "available", connection: { status: "error" } };
  }

  return {
    availability: "available",
    connection: { status: "ready", view: toSigaaIntegrationView(input.importedState) },
  };
}

export function isSigaaConnected(state: SigaaAccessState): boolean {
  return (
    state.availability === "available" &&
    state.connection.status === "ready" &&
    state.connection.view.kind === "connected"
  );
}

export function shouldEmphasizeSigaa(state: SigaaAccessState): boolean {
  if (state.availability === "checking") {
    return false;
  }

  if (state.availability === "sign_in_required") {
    return true;
  }

  return (
    state.connection.status === "ready" &&
    (state.connection.view.kind === "never_connected" ||
      state.connection.view.kind === "disconnected")
  );
}
