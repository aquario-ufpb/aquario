import { AlertCircle, CheckCircle2, Circle, Clock3 } from "lucide-react";

import type { SigaaDiscoveryConnectionState } from "@/analytics/posthog-events";
import type { SigaaAccessState } from "@/lib/client/sigaa/access-state";

export type SigaaMenuStatusView = Readonly<{
  connectionState: SigaaDiscoveryConnectionState;
  label: string;
  tone: "positive" | "attention" | "neutral";
  icon: typeof Circle;
  href: string;
  pulseIcon: boolean;
  screenReaderStatus?: string;
}>;

const SIGAA_LOGIN_HREF = "/login?next=%2Fme%2Facademico%3Fconnect%3D1";

export function getSigaaMenuStatus(state: SigaaAccessState): SigaaMenuStatusView {
  if (state.availability === "checking") {
    return {
      connectionState: "unknown",
      label: "SIGAA",
      tone: "neutral",
      icon: Clock3,
      href: SIGAA_LOGIN_HREF,
      pulseIcon: false,
      screenReaderStatus: "Verificando sua sessão.",
    };
  }

  if (state.availability === "sign_in_required") {
    return {
      connectionState: "unknown",
      label: "Conectar ao SIGAA",
      tone: "neutral",
      icon: Circle,
      href: SIGAA_LOGIN_HREF,
      pulseIcon: true,
    };
  }

  if (state.connection.status === "checking") {
    return {
      connectionState: "unknown",
      label: "SIGAA",
      tone: "neutral",
      icon: Clock3,
      href: "/me/academico",
      pulseIcon: false,
      screenReaderStatus: "Verificando status da conexão.",
    };
  }
  if (state.connection.status === "error") {
    return {
      connectionState: "error",
      label: "Ver conexão do SIGAA",
      tone: "neutral",
      icon: AlertCircle,
      href: "/me/academico",
      pulseIcon: false,
    };
  }
  const view = state.connection.view;
  if (view.kind === "connected") {
    return {
      connectionState: "connected",
      label: "SIGAA conectado",
      tone: "positive",
      icon: CheckCircle2,
      href: "/me/academico",
      pulseIcon: false,
    };
  }
  if (view.kind === "pending") {
    return {
      connectionState: "pending",
      label: "Concluir conexão",
      tone: "attention",
      icon: Clock3,
      href: "/me/academico",
      pulseIcon: false,
    };
  }
  if (view.kind === "disconnected") {
    return {
      connectionState: "disconnected",
      label: "Reconectar ao SIGAA",
      tone: "attention",
      icon: AlertCircle,
      href: "/me/academico?connect=1",
      pulseIcon: true,
    };
  }
  return {
    connectionState: "never_connected",
    label: "Conectar ao SIGAA",
    tone: "neutral",
    icon: Circle,
    href: "/me/academico?connect=1",
    pulseIcon: true,
  };
}
