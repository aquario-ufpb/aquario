import { AlertCircle, CheckCircle2, Circle, Clock3 } from "lucide-react";

import type { SigaaDiscoveryConnectionState } from "@/analytics/posthog-events";
import type { SigaaIntegrationView } from "@/lib/client/sigaa/view-model";

export type SigaaMenuStatusView = Readonly<{
  connectionState: SigaaDiscoveryConnectionState;
  label: string;
  tone: "positive" | "attention" | "neutral";
  icon: typeof Circle;
}>;

export function getSigaaMenuStatus(
  view: SigaaIntegrationView | "loading" | "error"
): SigaaMenuStatusView {
  if (view === "loading") {
    return {
      connectionState: "unknown",
      label: "Consultando SIGAA",
      tone: "neutral",
      icon: Clock3,
    };
  }
  if (view === "error") {
    return {
      connectionState: "error",
      label: "Ver conexão do SIGAA",
      tone: "neutral",
      icon: AlertCircle,
    };
  }
  if (view.kind === "connected") {
    return {
      connectionState: "connected",
      label: "SIGAA conectado",
      tone: "positive",
      icon: CheckCircle2,
    };
  }
  if (view.kind === "pending") {
    return {
      connectionState: "pending",
      label: "Concluir conexão",
      tone: "attention",
      icon: Clock3,
    };
  }
  if (view.kind === "disconnected") {
    return {
      connectionState: "disconnected",
      label: "Reconectar ao SIGAA",
      tone: "attention",
      icon: AlertCircle,
    };
  }
  return {
    connectionState: "never_connected",
    label: "Conectar ao SIGAA",
    tone: "neutral",
    icon: Circle,
  };
}
