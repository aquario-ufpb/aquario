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
import { getErrorMessage } from "@/lib/client/errors/api-error";
import { reauthenticateForSigaa } from "@/lib/client/api/sigaa-reauth";
import { synchronizeOwnSigaa } from "@/lib/client/api/sigaa";
import { clearSensitiveForm } from "@/lib/client/sigaa/clear-sensitive-form";

type SigaaConnectDialogProps = {
  open: boolean;
  requireConsent: boolean;
  onOpenChange: (open: boolean) => void;
  onSynchronized: () => Promise<void> | void;
};

export function SigaaConnectDialog({
  open,
  requireConsent,
  onOpenChange,
  onSynchronized,
}: SigaaConnectDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const attemptRef = useRef<Readonly<{ idempotencyKey: string; username: string }> | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    let aquarioPassword = String(formData.get("aquarioPassword") ?? "");
    let username = String(formData.get("sigaaUsername") ?? "").trim();
    let sigaaPassword = String(formData.get("sigaaPassword") ?? "");
    let proofToken = "";
    let syncStarted = false;

    if (requireConsent && formData.get("consent") !== "accepted") {
      setError("Confirme o consentimento para continuar.");
      return;
    }

    setError(null);
    setIsPending(true);
    try {
      const proof = await reauthenticateForSigaa(aquarioPassword);
      proofToken = proof.proofToken;
      const attempt =
        attemptRef.current?.username === username
          ? attemptRef.current
          : { idempotencyKey: crypto.randomUUID(), username };
      attemptRef.current = attempt;
      syncStarted = true;
      await synchronizeOwnSigaa({
        username,
        password: sigaaPassword,
        proofToken,
        idempotencyKey: attempt.idempotencyKey,
      });
      attemptRef.current = null;
      await onSynchronized();
      onOpenChange(false);
    } catch (caught) {
      if (syncStarted && !(caught instanceof TypeError)) {
        attemptRef.current = null;
      }
      setError(getErrorMessage(caught, "Não foi possível sincronizar com o SIGAA."));
    } finally {
      formData.delete("aquarioPassword");
      formData.delete("sigaaUsername");
      formData.delete("sigaaPassword");
      aquarioPassword = "";
      username = "";
      sigaaPassword = "";
      proofToken = "";
      clearSensitiveForm(form);
      setIsPending(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) {
      setError(null);
      clearSensitiveForm(formRef.current);
      if (!nextOpen) {
        attemptRef.current = null;
      }
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" data-ph-no-capture="true">
        <DialogHeader>
          <DialogTitle>
            {requireConsent ? "Conectar ao SIGAA" : "Atualizar dados do SIGAA"}
          </DialogTitle>
          <DialogDescription>
            As credenciais são enviadas uma única vez ao conector e não são persistidas. A sessão
            local do conector é encerrada ao fim da operação.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {requireConsent && (
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
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Sincronizando..."
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
