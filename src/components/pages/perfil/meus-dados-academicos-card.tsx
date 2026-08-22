"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SigaaSensitiveActionDialog } from "./sigaa-sensitive-action-dialog";

type MeusDadosAcademicosCardProps = {
  usuarioId: string;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value)
  );

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

  const synchronized = async () => {
    await refreshState();
    toast.success("Dados acadêmicos atualizados");
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
    return <Skeleton className="h-48 w-full" aria-label="Carregando integração SIGAA" />;
  }

  if (stateQuery.isError || !stateQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meus dados acadêmicos</CardTitle>
          <CardDescription>
            Não foi possível consultar o estado da integração SIGAA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => stateQuery.refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const view = toSigaaIntegrationView(stateQuery.data);
  const hasSnapshot = stateQuery.data.snapshot !== null;
  const requireConsent = stateQuery.data.connection?.consentVersion !== SIGAA_CONSENT_VERSION;

  const status =
    view.kind === "connected"
      ? `Conectado. Última sincronização em ${formatDateTime(view.synchronizedAt)}.`
      : view.kind === "disconnected"
        ? view.synchronizedAt
          ? `Desconectado. O snapshot de ${formatDateTime(view.synchronizedAt)} continua disponível.`
          : "Desconectado."
        : view.kind === "pending"
          ? "Conexão iniciada. Conclua uma sincronização para instalar o primeiro snapshot."
          : "Conecte sua conta para consultar seus dados acadêmicos em um só lugar.";

  return (
    <>
      <Card className="overflow-hidden border-sky-200 dark:border-sky-900">
        <CardHeader className="bg-sky-50/70 dark:bg-sky-950/20">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-sky-100 p-2 text-sky-800 dark:bg-sky-900 dark:text-sky-100">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Meus dados acadêmicos</CardTitle>
              <CardDescription>{status}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {view.kind === "connected" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Matrícula verificada pelo SIGAA: {view.matricula}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConnectOpen(true)}>
              <span
                className="mr-2 flex h-5 w-5 items-center justify-center rounded-sm bg-white/90 p-0.5"
                aria-hidden="true"
              >
                <Image src="/sigaa-icon.svg" alt="" width={16} height={16} aria-hidden="true" />
              </span>
              {view.kind === "never_connected" ? "Conectar ao SIGAA" : "Sincronizar agora"}
            </Button>
            {hasSnapshot && (
              <Button asChild variant="outline">
                <Link href="/me/academico">Ver dados acadêmicos</Link>
              </Button>
            )}
            {stateQuery.data.connection && stateQuery.data.connection.status !== "DISCONNECTED" && (
              <Button variant="outline" onClick={() => setDisconnectOpen(true)}>
                Desconectar
              </Button>
            )}
            {(stateQuery.data.connection || hasSnapshot) && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Excluir dados importados
              </Button>
            )}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Integração baseada no projeto aberto de{" "}
            <a
              href="https://github.com/PucaVaz/sigaa-for-ai-agents"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2"
            >
              PucaVaz
              <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
            </a>
            . O Aquário não guarda sua senha do SIGAA.
          </p>
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
        pendingLabel="Desconectando..."
        onOpenChange={setDisconnectOpen}
        action={disconnectOwnSigaa}
        onCompleted={disconnected}
      />
      <SigaaSensitiveActionDialog
        open={deleteOpen}
        title="Excluir dados importados"
        description="A conexão, o snapshot e as tentativas importadas serão removidos. Dados acadêmicos adicionados manualmente serão preservados."
        confirmLabel="Excluir dados importados"
        pendingLabel="Excluindo..."
        destructive
        onOpenChange={setDeleteOpen}
        action={deleteOwnSigaaData}
        onCompleted={deleted}
      />
    </>
  );
}
