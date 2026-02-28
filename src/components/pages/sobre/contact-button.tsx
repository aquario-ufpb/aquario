"use client";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/analytics/posthog-client";

export function ContactButton() {
  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className="rounded-full"
      onClick={() => trackEvent("sobre_contact_clicked")}
    >
      <a href="mailto:ralf.ferreira@academico.ufpb.br">Entrar em Contato</a>
    </Button>
  );
}
