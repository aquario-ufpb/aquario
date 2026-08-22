"use client";

import { useEffect, useId, useRef, useState } from "react";

import { trackEvent } from "@/analytics/posthog-client";
import type { SigaaSensitiveAction } from "@/analytics/posthog-events";
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
import { reauthenticateForSigaa } from "@/lib/client/api/sigaa-reauth";
import { getErrorMessage } from "@/lib/client/errors/api-error";
import { clearSensitiveForm } from "@/lib/client/sigaa/clear-sensitive-form";

type SigaaSensitiveActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  actionName: SigaaSensitiveAction;
  onOpenChange: (open: boolean) => void;
  action: (proofToken: string) => Promise<unknown>;
  onCompleted: () => Promise<void> | void;
};

export function SigaaSensitiveActionDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  actionName,
  onOpenChange,
  action,
  onCompleted,
}: SigaaSensitiveActionDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const passwordId = useId();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let password = String(formData.get("aquarioPassword") ?? "");
    let proofToken = "";

    setError(null);
    setIsPending(true);
    trackEvent("sigaa_sensitive_action_started", { action: actionName });
    try {
      const proof = await reauthenticateForSigaa(password);
      proofToken = proof.proofToken;
      await action(proofToken);
      await onCompleted();
      trackEvent("sigaa_sensitive_action_succeeded", { action: actionName });
      onOpenChange(false);
    } catch (caught) {
      trackEvent("sigaa_sensitive_action_failed", { action: actionName });
      setError(getErrorMessage(caught, "Não foi possível concluir a operação."));
    } finally {
      formData.delete("aquarioPassword");
      password = "";
      proofToken = "";
      clearSensitiveForm(formRef.current);
      setIsPending(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isPending) {
      setError(null);
      clearSensitiveForm(formRef.current);
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="ph-no-capture max-w-md" data-ph-no-capture="true">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="space-y-2">
            <Label htmlFor={passwordId}>Senha do Aquário</Label>
            <Input
              id={passwordId}
              name="aquarioPassword"
              type="password"
              autoComplete="current-password"
              data-1p-ignore="true"
              required
              disabled={isPending}
            />
          </div>
          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {error}
            </p>
          )}
          {isPending && (
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {pendingLabel}
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
              variant={destructive ? "destructive" : "default"}
              disabled={isPending}
            >
              {isPending ? pendingLabel : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
