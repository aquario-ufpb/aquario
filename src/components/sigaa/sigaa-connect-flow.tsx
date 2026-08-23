"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { trackEvent } from "@/analytics/posthog-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmOwnSigaaCourseChange,
  SigaaCourseChangeInvalidError,
  SigaaCourseChangeRequiredError,
  synchronizeOwnSigaa,
  type SigaaCourseChangeMismatch,
} from "@/lib/client/api/sigaa";
import { reauthenticateForSigaa } from "@/lib/client/api/sigaa-reauth";
import { getErrorMessage } from "@/lib/client/errors/api-error";
import { clearSensitiveForm } from "@/lib/client/sigaa/clear-sensitive-form";

export type SigaaConnectFlowProps = {
  requireConsent: boolean;
  onSynchronized: (courseReplaced: boolean) => Promise<void> | void;
  onExit: () => void;
  exitLabel?: string;
  pendingExitLabel?: string;
  pendingMode?: "close" | "continue_manual";
  autoFocusHeading?: boolean;
  onPendingChange?: (pending: boolean) => void;
  active?: boolean;
};

type FlowState =
  | Readonly<{ kind: "credentials"; error: string | null }>
  | Readonly<{
      kind: "course_change_confirmation";
      mismatch: SigaaCourseChangeMismatch;
      error: string | null;
    }>
  | Readonly<{
      kind: "submitting";
      operation: "sync" | "course_change";
      phase: "reauthenticating" | "synchronizing";
      isSlow: boolean;
      mismatch?: SigaaCourseChangeMismatch;
    }>
  | Readonly<{
      kind: "refresh_failed";
      courseReplaced: boolean;
      isRetrying: boolean;
      error: string;
    }>;

type Attempt = Readonly<{
  operation: "sync" | "course_change";
  proposalId: string | null;
  idempotencyKey: string;
  username: string;
}>;

export function SigaaConnectFlow(props: SigaaConnectFlowProps) {
  const { content } = useSigaaConnectFlowContent(props);
  return content;
}

export function useSigaaConnectFlowContent({
  requireConsent,
  onSynchronized,
  onExit,
  exitLabel = "Sair",
  pendingExitLabel = "Fechar e verificar depois",
  pendingMode = "close",
  autoFocusHeading = false,
  onPendingChange,
  active = true,
}: SigaaConnectFlowProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const courseChangeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const attemptRef = useRef<Attempt | null>(null);
  const wasActiveRef = useRef(active);
  const [state, setState] = useState<FlowState>({ kind: "credentials", error: null });
  const [proposalExpired, setProposalExpired] = useState(false);
  const submittingState = state.kind === "submitting" ? state : null;
  const refreshFailedState = state.kind === "refresh_failed" ? state : null;
  const isPending = submittingState !== null || refreshFailedState?.isRetrying === true;
  const isSynchronizing = submittingState?.phase === "synchronizing";
  const isSlow = submittingState?.isSlow ?? false;
  const mismatch =
    state.kind === "course_change_confirmation" || state.kind === "submitting"
      ? state.mismatch
      : undefined;
  const confirmingCourseChange = Boolean(mismatch);
  const error =
    state.kind === "credentials" || state.kind === "course_change_confirmation"
      ? state.error
      : null;
  const consentError =
    state.kind === "credentials" && error === "Confirme o consentimento para continuar.";
  const acknowledgmentError =
    state.kind === "course_change_confirmation" &&
    error === "Reconheça que a substituição do curso é irreversível para continuar.";
  const usernameId = `${id}-sigaa-username`;
  const sigaaPasswordId = `${id}-sigaa-password`;
  const aquarioPasswordId = `${id}-aquario-password`;
  const consentId = `${id}-sigaa-consent`;
  const consentDescriptionId = `${id}-sigaa-consent-description`;
  const acknowledgmentId = `${id}-course-change-acknowledged`;
  const errorId = `${id}-sigaa-form-error`;
  const headingId = `${id}-sigaa-flow-heading`;

  useEffect(() => {
    if (active && autoFocusHeading) {
      headingRef.current?.focus();
    }
  }, [active, autoFocusHeading]);

  useEffect(() => {
    onPendingChange?.(isPending);
    return () => onPendingChange?.(false);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (!isSynchronizing || isSlow) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setState(current => (current.kind === "submitting" ? { ...current, isSlow: true } : current));
    }, 60_000);

    return () => window.clearTimeout(timeout);
  }, [isSlow, isSynchronizing]);

  useEffect(() => {
    if (active && state.kind === "course_change_confirmation") {
      courseChangeRef.current?.focus();
    }
  }, [active, state.kind]);

  useEffect(() => {
    if (active && error) {
      const timeout = window.setTimeout(() => {
        const targetName = consentError
          ? "consent"
          : acknowledgmentError
            ? "courseChangeAcknowledged"
            : null;
        const target = targetName ? formRef.current?.elements.namedItem(targetName) : null;
        if (target instanceof HTMLElement) {
          target.focus();
        } else {
          errorRef.current?.focus();
        }
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [acknowledgmentError, active, consentError, error]);

  useEffect(() => {
    if (!mismatch) {
      setProposalExpired(false);
      return;
    }

    const expiresAt = Date.parse(mismatch.expiresAt);
    const updateExpiry = () =>
      setProposalExpired(!Number.isFinite(expiresAt) || expiresAt <= Date.now());
    updateExpiry();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return;
    }

    const timeout = window.setTimeout(
      updateExpiry,
      Math.min(expiresAt - Date.now(), 2_147_483_647)
    );
    return () => window.clearTimeout(timeout);
  }, [mismatch]);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = active;
    if (wasActive && !active) {
      clearSensitiveForm(formRef.current);
      if (!isPending) {
        attemptRef.current = null;
        setState({ kind: "credentials", error: null });
      }
    }
  }, [active, isPending]);

  useEffect(
    () => () => {
      clearSensitiveForm(formRef.current);
      attemptRef.current = null;
    },
    []
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state.kind === "submitting") {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    let aquarioPassword = String(formData.get("aquarioPassword") ?? "");
    let username = String(formData.get("sigaaUsername") ?? "").trim();
    let sigaaPassword = String(formData.get("sigaaPassword") ?? "");
    let proofToken = "";
    let connectorStarted = false;
    const operation = state.kind === "course_change_confirmation" ? "course_change" : "sync";
    const analyticsOperation =
      operation === "course_change" ? operation : requireConsent ? "connect" : "sync";
    const proposal = state.kind === "course_change_confirmation" ? state.mismatch : null;

    if (operation === "sync" && requireConsent && formData.get("consent") !== "accepted") {
      setState({ kind: "credentials", error: "Confirme o consentimento para continuar." });
      return;
    }
    if (
      state.kind === "course_change_confirmation" &&
      formData.get("courseChangeAcknowledged") !== "accepted"
    ) {
      setState({
        kind: "course_change_confirmation",
        mismatch: state.mismatch,
        error: "Reconheça que a substituição do curso é irreversível para continuar.",
      });
      return;
    }

    trackEvent("sigaa_connect_started", {
      operation: analyticsOperation,
      consent_required: operation === "sync" && requireConsent,
    });
    if (operation === "course_change") {
      trackEvent("sigaa_course_change_confirmed");
    }

    formData.delete("aquarioPassword");
    formData.delete("sigaaUsername");
    formData.delete("sigaaPassword");
    clearSensitiveForm(form);

    setState({
      kind: "submitting",
      operation,
      phase: "reauthenticating",
      isSlow: false,
      ...(proposal ? { mismatch: proposal } : {}),
    });
    try {
      const proof = await reauthenticateForSigaa(aquarioPassword, proposal?.proposalId);
      proofToken = proof.proofToken;
      setState(current =>
        current.kind === "submitting" ? { ...current, phase: "synchronizing" } : current
      );
      const proposalId = proposal?.proposalId ?? null;
      const previousAttempt = attemptRef.current;
      const attempt: Attempt =
        previousAttempt?.operation === operation &&
        previousAttempt.proposalId === proposalId &&
        previousAttempt.username === username
          ? previousAttempt
          : { operation, proposalId, idempotencyKey: crypto.randomUUID(), username };
      attemptRef.current = attempt;
      connectorStarted = true;

      if (proposal) {
        const result = await confirmOwnSigaaCourseChange({
          proposalId: proposal.proposalId,
          username,
          password: sigaaPassword,
          proofToken,
          idempotencyKey: attempt.idempotencyKey,
        });
        attemptRef.current = null;
        trackEvent("sigaa_connect_succeeded", {
          operation: analyticsOperation,
          course_replaced: result.courseReplaced,
        });
        try {
          await onSynchronized(result.courseReplaced);
        } catch {
          setState({
            kind: "refresh_failed",
            courseReplaced: result.courseReplaced,
            isRetrying: false,
            error:
              "Os dados foram sincronizados, mas esta tela não conseguiu atualizar. Tente carregar novamente.",
          });
          return;
        }
      } else {
        await synchronizeOwnSigaa({
          username,
          password: sigaaPassword,
          proofToken,
          idempotencyKey: attempt.idempotencyKey,
        });
        attemptRef.current = null;
        trackEvent("sigaa_connect_succeeded", {
          operation: analyticsOperation,
          course_replaced: false,
        });
        try {
          await onSynchronized(false);
        } catch {
          setState({
            kind: "refresh_failed",
            courseReplaced: false,
            isRetrying: false,
            error:
              "Os dados foram sincronizados, mas esta tela não conseguiu atualizar. Tente carregar novamente.",
          });
          return;
        }
      }
      setState({ kind: "credentials", error: null });
      onExit();
    } catch (caught) {
      if (caught instanceof SigaaCourseChangeRequiredError) {
        trackEvent("sigaa_course_change_shown");
        attemptRef.current = null;
        setState({
          kind: "course_change_confirmation",
          mismatch: caught.mismatch,
          error: null,
        });
        return;
      } else if (caught instanceof SigaaCourseChangeInvalidError) {
        attemptRef.current = null;
        setState({
          kind: "credentials",
          error: `${caught.message} Inicie uma nova sincronização.`,
        });
      } else {
        if (connectorStarted && !(caught instanceof TypeError)) {
          attemptRef.current = null;
        }
        const message = getErrorMessage(caught, "Não foi possível sincronizar com o SIGAA.");
        setState(
          proposal
            ? { kind: "course_change_confirmation", mismatch: proposal, error: message }
            : { kind: "credentials", error: message }
        );
      }
      trackEvent("sigaa_connect_failed", { operation: analyticsOperation });
    } finally {
      formData.delete("aquarioPassword");
      formData.delete("sigaaUsername");
      formData.delete("sigaaPassword");
      aquarioPassword = "";
      username = "";
      sigaaPassword = "";
      proofToken = "";
      clearSensitiveForm(form);
    }
  };

  const handleExit = () => {
    clearSensitiveForm(formRef.current);
    if (!isPending) {
      attemptRef.current = null;
      setState({ kind: "credentials", error: null });
    }
    onExit();
  };

  const clearForExternalExit = () => {
    clearSensitiveForm(formRef.current);
    if (!isPending) {
      attemptRef.current = null;
      setState({ kind: "credentials", error: null });
    }
  };

  const restartSynchronization = () => {
    attemptRef.current = null;
    clearSensitiveForm(formRef.current);
    setState({ kind: "credentials", error: null });
  };

  const retryLocalRefresh = async () => {
    if (!refreshFailedState || refreshFailedState.isRetrying) {
      return;
    }
    setState({ ...refreshFailedState, isRetrying: true });
    try {
      await onSynchronized(refreshFailedState.courseReplaced);
      setState({ kind: "credentials", error: null });
      onExit();
    } catch {
      setState({ ...refreshFailedState, isRetrying: false });
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={autoFocusHeading ? -1 : undefined}
          className="text-lg font-semibold leading-none tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {refreshFailedState
            ? "Dados sincronizados"
            : confirmingCourseChange
              ? "Confirmar substituição de curso"
              : requireConsent
                ? "Conectar ao SIGAA"
                : "Atualizar dados do SIGAA"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {refreshFailedState
            ? "A importação terminou. Falta apenas atualizar os dados exibidos pelo Aquário."
            : confirmingCourseChange
              ? "Confira a alteração e informe novamente as credenciais para confirmar."
              : "As credenciais são enviadas uma única vez ao conector e não são persistidas. A sessão local do conector é encerrada ao fim da operação."}
        </p>
      </div>

      {refreshFailedState ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-5">
          <p role="alert" className="text-sm text-muted-foreground">
            {refreshFailedState.error}
          </p>
          <Button
            type="button"
            onClick={() => void retryLocalRefresh()}
            disabled={refreshFailedState.isRetrying}
          >
            {refreshFailedState.isRetrying ? "Carregando dados…" : "Carregar dados novamente"}
          </Button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {submittingState && (
            <SigaaSynchronizationProgress
              state={submittingState}
              onExit={handleExit}
              exitLabel={pendingExitLabel}
              mode={pendingMode}
            />
          )}

          {!isPending && mismatch && (
            <div
              ref={courseChangeRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium">Curso atual</p>
                  <p>{mismatch.currentCourse}</p>
                  {mismatch.currentCenter && (
                    <p className="text-muted-foreground">{mismatch.currentCenter}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium">Curso após a substituição</p>
                  <p>{mismatch.targetCourse}</p>
                  {mismatch.targetCenter && (
                    <p className="text-muted-foreground">{mismatch.targetCenter}</p>
                  )}
                </div>
              </div>
              <p className="text-sm">
                O SIGAA informou <strong>{mismatch.sigaaCourse}</strong>.
              </p>
              <p className="text-sm font-medium text-destructive">
                Esta ação é irreversível no Aquário. Seus registros manuais serão preservados.{" "}
                {mismatch.targetCenter
                  ? "O curso e o centro do perfil serão substituídos pelos dados acima."
                  : "O curso do perfil será substituído pelo dado acima."}
              </p>
              <p className="text-sm text-muted-foreground">
                A alteração muda o curso e, quando indicado, o centro exibidos publicamente no seu
                perfil. Confirme antes de{" "}
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(mismatch.expiresAt))}
                .
              </p>
              {proposalExpired && (
                <div className="space-y-2 rounded-md border border-destructive/40 bg-background p-3">
                  <p role="alert" className="text-sm text-destructive">
                    Esta confirmação expirou. Inicie uma nova sincronização para conferir os dados
                    atualizados antes de substituir o curso.
                  </p>
                  <Button type="button" variant="outline" onClick={restartSynchronization}>
                    Iniciar nova sincronização
                  </Button>
                </div>
              )}
              <label className="flex items-start gap-3 text-sm" htmlFor={acknowledgmentId}>
                <input
                  id={acknowledgmentId}
                  name="courseChangeAcknowledged"
                  value="accepted"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  aria-invalid={acknowledgmentError}
                  aria-describedby={acknowledgmentError ? errorId : undefined}
                  disabled={isPending || proposalExpired}
                />
                <span>Entendo que meu curso será substituído e quero continuar.</span>
              </label>
            </div>
          )}

          {!isPending && !mismatch && requireConsent && (
            <div className="rounded-md border bg-muted/30 p-4">
              <label className="flex items-start gap-3 text-sm" htmlFor={consentId}>
                <input
                  id={consentId}
                  name="consent"
                  value="accepted"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  aria-invalid={consentError}
                  aria-describedby={
                    consentError ? `${consentDescriptionId} ${errorId}` : consentDescriptionId
                  }
                  disabled={isPending}
                />
                <span id={consentDescriptionId}>
                  Autorizo o Aquário a consultar meus dados acadêmicos no SIGAA e guardar apenas o
                  último snapshot acadêmico.
                </span>
              </label>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>O snapshot inclui:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>matrícula, curso, período, currículo, CRA e progresso;</li>
                  <li>componentes curriculares, cargas, pré-requisitos e correquisitos;</li>
                  <li>turmas, horários, salas, notas, resultados e faltas.</li>
                </ul>
                <p>
                  O Aquário mantém somente o snapshot mais recente. Metadados seguros das tentativas
                  são removidos após 90 dias. Senhas, cookies, HTML e PDF não são guardados.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2" hidden={isPending}>
            <Label htmlFor={usernameId}>Usuário do SIGAA</Label>
            <Input
              id={usernameId}
              name="sigaaUsername"
              autoComplete="username"
              data-1p-ignore="true"
              required
              maxLength={64}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2" hidden={isPending}>
            <Label htmlFor={sigaaPasswordId}>Senha do SIGAA</Label>
            <Input
              id={sigaaPasswordId}
              name="sigaaPassword"
              type="password"
              autoComplete="current-password"
              data-1p-ignore="true"
              required
              maxLength={256}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2" hidden={isPending}>
            <Label htmlFor={aquarioPasswordId}>Senha do Aquário</Label>
            <Input
              id={aquarioPasswordId}
              name="aquarioPassword"
              type="password"
              autoComplete="current-password"
              data-1p-ignore="true"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Usada somente para autorizar esta operação sensível.
            </p>
          </div>

          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              id={errorId}
              role="alert"
              className="text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {error}
            </p>
          )}

          {!isPending && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button type="button" variant="outline" onClick={handleExit}>
                {exitLabel}
              </Button>
              <Button
                type="submit"
                variant={confirmingCourseChange ? "destructive" : "default"}
                disabled={proposalExpired}
              >
                {confirmingCourseChange
                  ? "Substituir meu curso e sincronizar"
                  : requireConsent
                    ? "Conectar e sincronizar"
                    : "Sincronizar agora"}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );

  return { content, clearForExternalExit, headingId, isPending };
}

function SigaaSynchronizationProgress({
  state,
  onExit,
  exitLabel,
  mode,
}: Readonly<{
  state: Extract<FlowState, { kind: "submitting" }>;
  onExit: () => void;
  exitLabel: string;
  mode: "close" | "continue_manual";
}>) {
  const isSynchronizing = state.phase === "synchronizing";
  const title = state.isSlow
    ? "O SIGAA está demorando mais que o normal"
    : isSynchronizing
      ? "Consultando seus dados no SIGAA"
      : "Autorizando a sincronização";
  const description = state.isSlow
    ? mode === "continue_manual"
      ? "A consulta continua em andamento. Você pode seguir com a configuração manual e conferir os dados depois."
      : "A consulta ainda está em andamento."
    : isSynchronizing
      ? "O Aquário está importando seus dados acadêmicos."
      : "Estamos confirmando sua senha do Aquário antes de iniciar a consulta.";

  return (
    <section
      aria-label="Progresso da sincronização"
      className="space-y-5 rounded-xl border bg-muted/30 p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="font-medium text-foreground"
          >
            {title}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>

      <ol aria-label="Etapas da sincronização" className="grid gap-2 text-sm">
        <li className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
              isSynchronizing
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary text-primary"
            }`}
          >
            {isSynchronizing ? <Check className="size-3" strokeWidth={3} /> : "1"}
          </span>
          <span className={isSynchronizing ? "text-muted-foreground" : "font-medium"}>
            Autorizar acesso
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`flex size-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
              isSynchronizing
                ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            2
          </span>
          <span className={isSynchronizing ? "font-medium" : "text-muted-foreground"}>
            Importar dados acadêmicos
          </span>
        </li>
      </ol>

      <div className="space-y-3 border-t pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {mode === "continue_manual"
            ? "O processo pode levar até 3 minutos. Suas credenciais já foram removidas desta tela e não são salvas. Sair desta etapa não cancela um trabalho que já tenha sido iniciado."
            : "O processo pode levar até 3 minutos. Mantenha esta janela aberta até concluir. Suas credenciais já foram removidas desta tela e não são salvas."}
        </p>
        {mode === "continue_manual" && (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onExit}>
            {exitLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
