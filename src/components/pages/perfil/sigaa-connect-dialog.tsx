"use client";

import { useSigaaConnectFlowContent } from "@/components/sigaa/sigaa-connect-flow";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type SigaaConnectDialogProps = {
  open: boolean;
  requireConsent: boolean;
  onOpenChange: (open: boolean) => void;
  onSynchronized: (courseReplaced: boolean) => Promise<void> | void;
};

export function SigaaConnectDialog({
  open,
  requireConsent,
  onOpenChange,
  onSynchronized,
}: SigaaConnectDialogProps) {
  const flow = useSigaaConnectFlowContent({
    active: open,
    requireConsent,
    onSynchronized,
    onExit: () => onOpenChange(false),
    exitLabel: "Cancelar",
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      flow.clearForExternalExit();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-labelledby={flow.headingId}
        className="ph-no-capture max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain sm:max-w-lg"
        data-ph-no-capture="true"
      >
        <DialogTitle className="sr-only">Sincronização com o sistema acadêmico</DialogTitle>
        <DialogDescription className="sr-only">
          Informe suas credenciais para sincronizar seus dados acadêmicos.
        </DialogDescription>
        {flow.content}
      </DialogContent>
    </Dialog>
  );
}
