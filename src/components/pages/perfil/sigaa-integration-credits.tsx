import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/client/utils";

type SigaaIntegrationCreditsProps = {
  className?: string;
};

const creditLinkClassName =
  "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-aquario-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function SigaaIntegrationCredits({ className }: SigaaIntegrationCreditsProps) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Fonte de dados:{" "}
      <a
        href="https://github.com/PucaVaz/sigaa-for-ai-agents"
        target="_blank"
        rel="noreferrer"
        className={creditLinkClassName}
      >
        sigaa-for-ai-agents, de PucaVaz
        <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      . Integração:{" "}
      <a
        href="https://github.com/aquario-ufpb/aquario-sigaa-connector"
        target="_blank"
        rel="noreferrer"
        className={creditLinkClassName}
      >
        aquario-sigaa-connector
        <ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
      .
    </p>
  );
}
