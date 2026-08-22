"use client";

import { useEffect, useRef, useState } from "react";

import { trackEvent } from "@/analytics/posthog-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type SigaaConnectDialogProps = {
  open: boolean;
  requireConsent: boolean;
  onOpenChange: (open: boolean) => void;
  onSynchronized: (courseReplaced: boolean) => Promise<void> | void;
};

type DialogState =
  | Readonly<{ kind: "credentials"; error: string | null }>
  | Readonly<{
      kind: "course_change_confirmation";
      mismatch: SigaaCourseChangeMismatch;
      error: string | null;
    }>
  | Readonly<{
      kind: "submitting";
      operation: "sync" | "course_change";
      mismatch?: SigaaCourseChangeMismatch;
    }>;

type Attempt = Readonly<{
  operation: "sync" | "course_change";
  proposalId: string | null;
  idempotencyKey: string;
  username: string;
}>;

export function SigaaConnectDialog({
  open,
  requireConsent,
  onOpenChange,
  onSynchronized,
}: SigaaConnectDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const courseChangeRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const attemptRef = useRef<Attempt | null>(null);
  const [state, setState] = useState<DialogState>({ kind: "credentials", error: null });
  const [proposalExpired, setProposalExpired] = useState(false);
  const isPending = state.kind === "submitting";
  const mismatch = state.kind === "credentials" ? undefined : state.mismatch;
  const confirmingCourseChange = Boolean(mismatch);
  const error = state.kind === "submitting" ? null : state.error;
  const consentError =
    state.kind === "credentials" && error === "Confirme o consentimento para continuar.";
  const acknowledgmentError =
    state.kind === "course_change_confirmation" &&
    error === "Reconheça que a substituição do curso é irreversível para continuar.";

  useEffect(() => {
    if (state.kind === "course_change_confirmation") {
      courseChangeRef.current?.focus();
    }
  }, [state.kind]);

  useEffect(() => {
    if (open && error) {
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
  }, [acknowledgmentError, consentError, error, open]);

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

    setState({
      kind: "submitting",
      operation,
      ...(proposal ? { mismatch: proposal } : {}),
    });
    try {
      const proof = await reauthenticateForSigaa(aquarioPassword, proposal?.proposalId);
      proofToken = proof.proofToken;
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
        await onSynchronized(result.courseReplaced);
        trackEvent("sigaa_connect_succeeded", {
          operation: analyticsOperation,
          course_replaced: result.courseReplaced,
        });
      } else {
        await synchronizeOwnSigaa({
          username,
          password: sigaaPassword,
          proofToken,
          idempotencyKey: attempt.idempotencyKey,
        });
        attemptRef.current = null;
        await onSynchronized(false);
        trackEvent("sigaa_connect_succeeded", {
          operation: analyticsOperation,
          course_replaced: false,
        });
      }
      setState({ kind: "credentials", error: null });
      onOpenChange(false);
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

  const handleOpenChange = (nextOpen: boolean) => {
    clearSensitiveForm(formRef.current);
    if (!nextOpen && !isPending) {
      attemptRef.current = null;
      setState({ kind: "credentials", error: null });
    }
    onOpenChange(nextOpen);
  };

  const restartSynchronization = () => {
    attemptRef.current = null;
    clearSensitiveForm(formRef.current);
    setState({ kind: "credentials", error: null });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="ph-no-capture max-h-[calc(100dvh-2rem)] overscroll-contain overflow-y-auto sm:max-w-lg"
        data-ph-no-capture="true"
      >
        <DialogHeader>
          <DialogTitle>
            {confirmingCourseChange
              ? "Confirmar substituição de curso"
              : requireConsent
                ? "Conectar ao SIGAA"
                : "Atualizar dados do SIGAA"}
          </DialogTitle>
          <DialogDescription>
            {confirmingCourseChange
              ? "Confira a alteração e informe novamente as credenciais para confirmar."
              : "As credenciais são enviadas uma única vez ao conector e não são persistidas. A sessão local do conector é encerrada ao fim da operação."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {mismatch && (
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
              <label
                className="flex items-start gap-3 text-sm"
                htmlFor="course-change-acknowledged"
              >
                <input
                  id="course-change-acknowledged"
                  name="courseChangeAcknowledged"
                  value="accepted"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  aria-invalid={acknowledgmentError}
                  aria-describedby={acknowledgmentError ? "sigaa-form-error" : undefined}
                  disabled={isPending || proposalExpired}
                />
                <span>Entendo que meu curso será substituído e quero continuar.</span>
              </label>
            </div>
          )}

          {!mismatch && requireConsent && (
            <div className="rounded-md border bg-muted/30 p-4">
              <label className="flex items-start gap-3 text-sm" htmlFor="sigaa-consent">
                <input
                  id="sigaa-consent"
                  name="consent"
                  value="accepted"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  aria-invalid={consentError}
                  aria-describedby={
                    consentError
                      ? "sigaa-consent-description sigaa-form-error"
                      : "sigaa-consent-description"
                  }
                  disabled={isPending}
                />
                <span id="sigaa-consent-description">
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

          <div className="space-y-2">
            <Label htmlFor="sigaa-username">Usuário do SIGAA</Label>
            <Input
              id="sigaa-username"
              name="sigaaUsername"
              autoComplete="username"
              data-1p-ignore="true"
              required
              maxLength={64}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sigaa-password">Senha do SIGAA</Label>
            <Input
              id="sigaa-password"
              name="sigaaPassword"
              type="password"
              autoComplete="current-password"
              data-1p-ignore="true"
              required
              maxLength={256}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aquario-password">Senha do Aquário</Label>
            <Input
              id="aquario-password"
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
              id="sigaa-form-error"
              role="alert"
              className="text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {error}
            </p>
          )}
          {isPending && (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              Consultando o SIGAA. Isso pode levar até três minutos. Parar de esperar não garante o
              cancelamento do trabalho já aceito.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={false}
            >
              {isPending ? "Parar de esperar" : "Cancelar"}
            </Button>
            <Button
              type="submit"
              variant={confirmingCourseChange ? "destructive" : "default"}
              disabled={isPending || proposalExpired}
            >
              {isPending
                ? "Sincronizando…"
                : confirmingCourseChange
                  ? "Substituir meu curso e sincronizar"
                  : requireConsent
                    ? "Conectar e sincronizar"
                    : "Sincronizar agora"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
