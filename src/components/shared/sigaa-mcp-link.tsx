"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { trackEvent } from "@/analytics/posthog-client";

import { SIGAA_MCP_URL } from "./resource-links";

type SigaaMcpLinkProps = Readonly<
  {
    location: "desktop_resources" | "mobile_menu" | "resources_page" | "landing";
  } & Omit<ComponentPropsWithoutRef<"a">, "href" | "rel" | "target">
>;

export const SigaaMcpLink = forwardRef<HTMLAnchorElement, SigaaMcpLinkProps>(function SigaaMcpLink(
  { children, className, location, onClick, ...anchorProps },
  ref
) {
  return (
    <a
      {...anchorProps}
      ref={ref}
      href={SIGAA_MCP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          trackEvent("sigaa_mcp_clicked", { location });
        }
      }}
    >
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
});
