"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { trackEvent } from "@/analytics/posthog-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteOwnSigaaData,
  disconnectOwnSigaa,
  SIGAA_CONSENT_VERSION,
} from "@/lib/client/api/sigaa";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { queryKeys } from "@/lib/client/query-keys";
import { toSigaaIntegrationView } from "@/lib/client/sigaa/view-model";

import { SigaaConnectDialog } from "./sigaa-connect-dialog";
import { SigaaIntegrationCredits } from "./sigaa-integration-credits";
import { SigaaSensitiveActionDialog } from "./sigaa-sensitive-action-dialog";

type MeusDadosAcademicosCardProps = {
  usuarioId: string;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value) + "%";

const benefitItems = [
  { icon: BarChart3, label: "CRA e progresso do curso" },
  { icon: GraduationCap, label: "Notas, resultados e faltas" },
  { icon: CalendarDays, label: "Turmas do período atual" },
] as const;

export function MeusDadosAcademicosCard({ usuarioId }: MeusDadosAcademicosCardProps) {
  const queryClient = useQueryClient();
  const stateQuery = useOwnSigaaAcademicState();
  const [connectOpen, setConnectOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const refreshState = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sigaa.state(usuarioId) });
    } catch {
      toast.warning("A operação foi concluída, mas o estado não pôde ser atualizado.", {
        description: "Recarregue a página para consultar o resultado.",
      });
    }
  };

  const synchronized = async (courseReplaced: boolean) => {
    await refreshState();
    if (courseReplaced) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current(usuarioId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all }),
      ]);
    }
    toast.success(
      courseReplaced ? "Curso substituído e dados atualizados" : "Dados acadêmicos atualizados"
    );
  };

  const disconnected = async () => {
    await refreshState();
    toast.success("Integração desconectada", {
      description: "O último snapshot acadêmico foi preservado.",
    });
  };

  const deleted = async () => {
    await refreshState();
    toast.success("Dados importados excluídos");
  };

  if (stateQuery.isLoading) {
    return (
      <Card
        className="ph-no-capture overflow-hidden"
        data-ph-no-capture="true"
        aria-label="Carregando integração SIGAA"
      >
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-64 max-w-[60vw]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map(item => (
            <Skeleton key={item} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <Card className="ph-no-capture" data-ph-no-capture="true">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Não foi possível carregar seus dados</CardTitle>
          <CardDescription>
            Sua integração continua como estava. Tente consultar novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button variant="outline" onClick={() => stateQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <SigaaIntegrationCredits className="border-t pt-4" />
        </CardContent>
      </Card>
    );
  }

  const view = toSigaaIntegrationView(stateQuery.data);
  const snapshot = stateQuery.data.snapshot;
  const hasSnapshot = snapshot !== null;
  const requireConsent = stateQuery.data.connection?.consentVersion !== SIGAA_CONSENT_VERSION;
  const totalProgress = snapshot?.payload.curriculum.progress.find(item =>
    item.description.toLocaleLowerCase("pt-BR").includes("total")
  );

  const snapshotStatus =
    view.kind === "connected"
      ? `Atualizado em ${formatDateTime(view.synchronizedAt)}`
      : view.kind === "disconnected" && view.synchronizedAt
        ? `Última leitura em ${formatDateTime(view.synchronizedAt)}`
        : snapshot
          ? `Última leitura em ${formatDateTime(snapshot.synchronizedAt)}`
          : null;

  const openConnectDialog = () => {
    trackEvent("sigaa_connect_opened", {
      operation: view.kind === "never_connected" ? "connect" : "sync",
      consent_required: requireConsent,
    });
    setConnectOpen(true);
  };

  const connectLabel =
    view.kind === "never_connected"
      ? "Conectar ao SIGAA"
      : view.kind === "pending"
        ? "Concluir conexão"
        : view.kind === "disconnected"
          ? "Reconectar e atualizar"
          : "Sincronizar agora";

  return (
    <>
      <Card
        className="ph-no-capture overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-sky-50/60 shadow-sm dark:to-sky-950/20"
        data-ph-no-capture="true"
      >
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-sky-100 p-2.5 text-sky-800 dark:bg-sky-900 dark:text-sky-100">
                <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-xl">Sua vida acadêmica, em um só lugar</CardTitle>
                <CardDescription className="max-w-2xl leading-relaxed">
                  {hasSnapshot
                    ? snapshotStatus
                    : view.kind === "pending"
                      ? "A conexão foi iniciada. Termine a primeira sincronização para ver seus dados."
                      : view.kind === "disconnected"
                        ? "Reconecte ao SIGAA para importar seu primeiro resumo acadêmico."
                        : "Conecte uma vez para organizar as informações que mais importam no semestre."}
                </CardDescription>
              </div>
            </div>
            {hasSnapshot && (
              <Badge
                variant="outline"
                className={
                  view.kind === "connected"
                    ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "w-fit border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                }
              >
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                    view.kind === "connected" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {view.kind === "connected" ? "Sincronizado" : "Snapshot disponível"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {snapshot ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-background/75 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">CRA</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {snapshot.payload.curriculum.cra.value ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/75 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Progresso total</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {totalProgress ? formatPercent(totalProgress.completedPercent) : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/75 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Turmas atuais</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {snapshot.payload.classes.length}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Matrícula verificada: {snapshot.payload.identity.matricula}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/me/academico">Abrir painel acadêmico</Link>
                  </Button>
                  <Button variant="outline" onClick={openConnectDialog}>
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    {connectLabel}
                  </Button>
                  {(stateQuery.data.connection || hasSnapshot) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-muted-foreground">
                          Gerenciar
                          <ChevronDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {stateQuery.data.connection?.status !== "DISCONNECTED" && (
                          <DropdownMenuItem
                            onSelect={() => {
                              trackEvent("sigaa_sensitive_action_opened", {
                                action: "disconnect",
                              });
                              setDisconnectOpen(true);
                            }}
                          >
                            Desconectar do SIGAA
                          </DropdownMenuItem>
                        )}
                        {stateQuery.data.connection?.status !== "DISCONNECTED" && (
                          <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => {
                            trackEvent("sigaa_sensitive_action_opened", { action: "delete" });
                            setDeleteOpen(true);
                          }}
                        >
                          Excluir dados importados
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {benefitItems.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/75 px-4 py-3 text-sm font-medium"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" aria-hidden />
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  Sua senha é usada apenas durante a consulta e não é armazenada.
                </p>
                <Button onClick={openConnectDialog} className="shrink-0">
                  <span
                    className="mr-2 flex h-5 w-5 items-center justify-center rounded-sm bg-white/90 p-0.5"
                    aria-hidden="true"
                  >
                    <Image src="/sigaa-icon.svg" alt="" width={16} height={16} aria-hidden="true" />
                  </span>
                  {connectLabel}
                </Button>
              </div>
            </>
          )}

          <SigaaIntegrationCredits className="border-t pt-4" />
        </CardContent>
      </Card>

      <SigaaConnectDialog
        open={connectOpen}
        requireConsent={requireConsent}
        onOpenChange={setConnectOpen}
        onSynchronized={synchronized}
      />
      <SigaaSensitiveActionDialog
        open={disconnectOpen}
        title="Desconectar do SIGAA"
        description="A conexão será encerrada, mas o último snapshot acadêmico e o histórico de tentativas serão preservados."
        confirmLabel="Desconectar"
        pendingLabel="Desconectando…"
        actionName="disconnect"
        onOpenChange={setDisconnectOpen}
        action={disconnectOwnSigaa}
        onCompleted={disconnected}
      />
      <SigaaSensitiveActionDialog
        open={deleteOpen}
        title="Excluir dados importados"
        description="A conexão, o snapshot e as tentativas importadas serão removidos. Dados acadêmicos adicionados manualmente serão preservados."
        confirmLabel="Excluir dados importados"
        pendingLabel="Excluindo…"
        actionName="delete"
        destructive
        onOpenChange={setDeleteOpen}
        action={deleteOwnSigaaData}
        onCompleted={deleted}
      />
    </>
  );
}
