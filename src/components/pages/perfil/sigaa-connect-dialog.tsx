"use client";

import { useRef, useState } from "react";

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
  const attemptRef = useRef<Attempt | null>(null);
  const [state, setState] = useState<DialogState>({ kind: "credentials", error: null });
  const isPending = state.kind === "submitting";
  const mismatch = state.kind === "credentials" ? undefined : state.mismatch;
  const confirmingCourseChange = Boolean(mismatch);
  const error = state.kind === "submitting" ? null : state.error;

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
      } else {
        await synchronizeOwnSigaa({
          username,
          password: sigaaPassword,
          proofToken,
          idempotencyKey: attempt.idempotencyKey,
        });
        attemptRef.current = null;
        await onSynchronized(false);
      }
      setState({ kind: "credentials", error: null });
      onOpenChange(false);
    } catch (caught) {
      if (caught instanceof SigaaCourseChangeRequiredError) {
        attemptRef.current = null;
        setState({
          kind: "course_change_confirmation",
          mismatch: caught.mismatch,
          error: null,
        });
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
    if (!isPending) {
      clearSensitiveForm(formRef.current);
      if (!nextOpen) {
        attemptRef.current = null;
        setState({ kind: "credentials", error: null });
      }
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
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
            <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
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
                  disabled={isPending}
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
                  aria-describedby="sigaa-consent-description"
                  disabled={isPending}
                />
                <span id="sigaa-consent-description">
                  Autorizo o Aquário a consultar meus dados acadêmicos no SIGAA e guardar apenas o
                  snapshot acadêmico descrito nesta tela.
                </span>
              </label>
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
            <p role="alert" className="text-sm text-destructive">
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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={confirmingCourseChange ? "destructive" : "default"}
              disabled={isPending}
            >
              {isPending
                ? "Sincronizando..."
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
