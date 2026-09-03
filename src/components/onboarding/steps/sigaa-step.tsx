"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Database, RefreshCw, ShieldCheck } from "lucide-react";

import { SigaaConnectFlow } from "@/components/sigaa/sigaa-connect-flow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { queryKeys } from "@/lib/client/query-keys";

type SigaaStepProps = {
  onComplete: () => Promise<void>;
  onSkip: () => Promise<void>;
  isMutating: boolean;
  onPendingChange?: (pending: boolean) => void;
};

type StepView = "intro" | "connect" | "review" | "success";

export function SigaaStep({ onComplete, onSkip, isMutating, onPendingChange }: SigaaStepProps) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const stateQuery = useOwnSigaaAcademicState();
  const [view, setView] = useState<StepView>("intro");
  const synchronizationFinishedRef = useRef(false);
  const manualExitStartedRef = useRef(false);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (view === "intro" && stateQuery.data?.snapshot) {
      setView("review");
    }
  }, [stateQuery.data?.snapshot, view]);

  useEffect(() => {
    if (view === "review" || view === "success") {
      summaryHeadingRef.current?.focus();
    }
  }, [view]);

  const handleSynchronized = async (courseReplaced: boolean) => {
    if (courseReplaced) {
      await queryClient.refetchQueries(
        { queryKey: queryKeys.usuarios.current(userId), type: "active" },
        { throwOnError: true }
      );
      queryClient.removeQueries({ queryKey: ["curriculos"] });
    }
    await queryClient.refetchQueries(
      { queryKey: queryKeys.sigaa.state(userId), type: "active" },
      { throwOnError: true }
    );
    synchronizationFinishedRef.current = true;
    setView("success");
  };

  const skipManually = () => {
    if (manualExitStartedRef.current || isMutating) {
      return;
    }
    manualExitStartedRef.current = true;
    void Promise.resolve(onSkip()).catch(() => {
      manualExitStartedRef.current = false;
    });
  };

  const handleFlowExit = () => {
    if (synchronizationFinishedRef.current) {
      synchronizationFinishedRef.current = false;
      return;
    }
    skipManually();
  };

  if (stateQuery.isLoading) {
    return (
      <div
        className="mx-auto w-full max-w-2xl space-y-5"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-7 w-56" />
          <Skeleton className="mx-auto h-4 w-full max-w-md" />
          <p className="text-sm text-muted-foreground">Consultando seus dados do SIGAA…</p>
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (stateQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5 text-center">
        <div className="space-y-2">
          <h2 className="text-pretty text-2xl font-bold">Não foi possível consultar o SIGAA</h2>
          <p className="text-muted-foreground">
            Você pode tentar novamente ou continuar configurando tudo manualmente.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" className="min-h-11 gap-2" onClick={() => stateQuery.refetch()}>
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button className="min-h-11" onClick={skipManually} disabled={isMutating}>
            Prefiro configurar manualmente
          </Button>
        </div>
      </div>
    );
  }

  if (view === "connect") {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SigaaConnectFlow
          requireConsent={!stateQuery.data?.connection?.consentedAt}
          onSynchronized={handleSynchronized}
          onExit={handleFlowExit}
          exitLabel="Prefiro configurar manualmente"
          pendingExitLabel="Continuar manualmente e verificar depois"
          pendingMode="continue_manual"
          autoFocusHeading
          onPendingChange={onPendingChange}
        />
      </div>
    );
  }

  const snapshot = stateQuery.data?.snapshot?.payload;
  if ((view === "review" && snapshot) || view === "success") {
    const completedCount = snapshot?.curriculum.components.filter(
      component => component.status === "completed"
    ).length;
    const enrolledCount = snapshot?.curriculum.components.filter(
      component => component.status === "enrolled"
    ).length;

    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2
            ref={summaryHeadingRef}
            tabIndex={-1}
            className="text-pretty text-2xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {view === "success" ? "Dados importados com sucesso" : "Seus dados já estão prontos"}
          </h2>
          <p className="text-muted-foreground">
            Confira o resumo. Nos próximos passos, você decide o que realmente entra no seu perfil.
          </p>
        </div>
        <div className="grid gap-3 text-left sm:grid-cols-3" role="status" aria-live="polite">
          <SummaryItem
            label="Curso informado"
            value={snapshot?.identity.sourceCourse ?? "Dados atualizados"}
          />
          <SummaryItem
            label="Disciplinas concluídas encontradas"
            value={completedCount === undefined ? "Confira a seguir" : String(completedCount)}
          />
          <SummaryItem
            label="Disciplinas atuais encontradas"
            value={enrolledCount === undefined ? "Confira a seguir" : String(enrolledCount)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Nos próximos passos, o Aquário confere esses dados com sua grade e deixa marcadas somente
          as correspondências seguras. Nenhuma disciplina, período ou turma será alterada sem sua
          confirmação.
        </p>
        <Button size="lg" className="min-h-11" onClick={onComplete} disabled={isMutating}>
          Usar estes dados
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-aquario-primary/10 text-aquario-primary">
        <Database aria-hidden="true" className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-aquario-primary">Novo no Aquário</p>
        <h2 className="text-pretty text-2xl font-bold">Configure seu perfil com o SIGAA</h2>
        <p className="mx-auto max-w-xl text-pretty text-muted-foreground">
          Importe sua grade, disciplinas concluídas e cadeiras atuais. Depois, você apenas confere e
          confirma cada etapa.
        </p>
      </div>
      <div className="mx-auto grid max-w-xl gap-3 text-left sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <ShieldCheck aria-hidden="true" className="mb-2 h-5 w-5 text-emerald-600" />
          <p className="font-medium">Credenciais não são guardadas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua senha é usada somente durante a importação.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <CheckCircle2 aria-hidden="true" className="mb-2 h-5 w-5 text-aquario-primary" />
          <p className="font-medium">Você confirma antes de salvar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nada substitui suas escolhas automaticamente.
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <Button size="lg" className="min-h-11" onClick={() => setView("connect")}>
          Importar do SIGAA
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="min-h-11"
          onClick={skipManually}
          disabled={isMutating}
        >
          Prefiro configurar manualmente
        </Button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold">{value}</p>
    </div>
  );
}
