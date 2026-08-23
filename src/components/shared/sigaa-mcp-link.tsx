"use client";

import type { ReactNode } from "react";

import { trackEvent } from "@/analytics/posthog-client";

import { SIGAA_MCP_URL } from "./resource-links";

type SigaaMcpLinkProps = Readonly<{
  children: ReactNode;
  className?: string;
  location: "desktop_resources" | "mobile_menu" | "resources_page" | "landing";
}>;

export function SigaaMcpLink({ children, className, location }: SigaaMcpLinkProps) {
  return (
    <a
      href={SIGAA_MCP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => trackEvent("sigaa_mcp_clicked", { location })}
    >
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
