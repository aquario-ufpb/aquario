"use client";

import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/client/utils";

const SIGAA_CONNECT_HREF = "/me/academico?connect=1";

const pressableClassName =
  "motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.97]";

type SigaaConnectNudgeCardProps = Readonly<{
  onConnect: () => void;
  onDismiss: () => void;
}>;

export function SigaaConnectNudgeCard({ onConnect, onDismiss }: SigaaConnectNudgeCardProps) {
  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-slate-900/40" />
        <DialogPrimitive.Content
          aria-labelledby="sigaa-connect-nudge-title"
          aria-describedby="sigaa-connect-nudge-description"
          className={cn(
            "fixed left-4 right-4 top-[50%] z-50 grid w-auto max-w-[400px] translate-y-[-50%] gap-0 rounded-3xl border border-sky-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]",
            "dark:border-sky-800 dark:bg-slate-900",
            "duration-[260ms] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:left-[50%] sm:right-auto sm:w-full sm:-translate-x-1/2",
            "motion-safe:ease-out"
          )}
        >
          <DialogPrimitive.Close
            className={cn(
              "absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-sm text-slate-400 opacity-70",
              "[@media(hover:hover)]:hover:bg-sky-50 [@media(hover:hover)]:hover:text-aquario-primary [@media(hover:hover)]:hover:opacity-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "dark:text-slate-500 dark:[@media(hover:hover)]:hover:bg-sky-950/60 dark:[@media(hover:hover)]:hover:text-sky-200",
              pressableClassName
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div
            aria-hidden="true"
            className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-sky-50 text-aquario-primary dark:bg-sky-950/70 dark:text-sky-200"
          >
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-aquario-primary dark:text-sky-200">
            Novidade no Aquário
          </p>
          <DialogTitle
            id="sigaa-connect-nudge-title"
            className="text-left text-[22px] font-bold leading-tight text-aquario-primary dark:text-sky-100"
          >
            Conecte com o SIGAA
          </DialogTitle>
          <DialogDescription
            id="sigaa-connect-nudge-description"
            className="mt-2 text-left text-sm leading-relaxed text-slate-500 dark:text-slate-400"
          >
            Sua conta já tá pronta. Falta só puxar os dados acadêmicos. Dá pra fazer agora, e a senha
            não fica salva.
          </DialogDescription>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              asChild
              className={cn(
                "h-auto w-full rounded-full bg-aquario-primary px-4 py-3 text-sm font-semibold text-white",
                "[@media(hover:hover)]:hover:bg-aquario-primary/90",
                pressableClassName
              )}
            >
              <Link href={SIGAA_CONNECT_HREF} onClick={onConnect}>
                Conectar agora
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
              className={cn(
                "h-auto w-full rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700",
                "[@media(hover:hover)]:hover:bg-slate-200",
                "dark:bg-slate-800 dark:text-slate-200 dark:[@media(hover:hover)]:hover:bg-slate-700",
                pressableClassName
              )}
            >
              Deixar pra depois
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
