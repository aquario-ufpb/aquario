import type { SigaaImportedState } from "@/lib/client/api/sigaa";

export type SigaaIntegrationView =
  | Readonly<{ kind: "never_connected" }>
  | Readonly<{ kind: "pending" }>
  | Readonly<{ kind: "connected"; synchronizedAt: string; matricula: string }>
  | Readonly<{ kind: "disconnected"; synchronizedAt: string | null }>;

export function toSigaaIntegrationView(state: SigaaImportedState): SigaaIntegrationView {
  if (!state.connection) {
    return { kind: "never_connected" };
  }
  if (state.connection.status === "PENDING") {
    return { kind: "pending" };
  }
  if (state.connection.status === "DISCONNECTED") {
    return { kind: "disconnected", synchronizedAt: state.snapshot?.synchronizedAt ?? null };
  }
  if (!state.snapshot || !state.matricula.value) {
    return { kind: "pending" };
  }
  return {
    kind: "connected",
    synchronizedAt: state.snapshot.synchronizedAt,
    matricula: state.matricula.value,
  };
}
