"use client";

import { Mail, Instagram, Linkedin, Globe } from "lucide-react";
import { trackEvent } from "@/analytics/posthog-client";
import { Entidade } from "@/lib/shared/types";

type EntidadeContactLinksProps = {
  entidade: Entidade;
};

export function EntidadeContactLinks({ entidade }: EntidadeContactLinksProps) {
  const handleInstagramClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name,
      entidade_type: entidade.tipo,
      link_type: "instagram",
    });
  };

  const handleLinkedinClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name,
      entidade_type: entidade.tipo,
      link_type: "linkedin",
    });
  };

  const handleWebsiteClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name,
      entidade_type: entidade.tipo,
      link_type: "website",
    });
  };

  const hasAnyContact =
    entidade.contato_email || entidade.instagram || entidade.linkedin || entidade.website;

  if (!hasAnyContact) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entidade.contato_email && (
        <a
          href={`mailto:${entidade.contato_email}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-colors text-xs"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </a>
      )}
      {entidade.instagram && (
        <a
          href={entidade.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-colors text-xs"
          onClick={handleInstagramClick}
        >
          <Instagram className="w-3.5 h-3.5" />
          <span>Instagram</span>
        </a>
      )}
      {entidade.linkedin && (
        <a
          href={entidade.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-colors text-xs"
          onClick={handleLinkedinClick}
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span>LinkedIn</span>
        </a>
      )}
      {entidade.website && (
        <a
          href={entidade.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/30 hover:border-border/60 hover:bg-accent/10 transition-colors text-xs"
          onClick={handleWebsiteClick}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Website</span>
        </a>
      )}
    </div>
  );
}
