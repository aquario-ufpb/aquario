"use client";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/analytics/posthog-client";

export function ContactButton() {
  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      onClick={() => trackEvent("sobre_contact_clicked")}
    >
      <a href="mailto:ralf.ferreira@academico.ufpb.br">Entrar em Contato</a>
    </Button>
  );
}
