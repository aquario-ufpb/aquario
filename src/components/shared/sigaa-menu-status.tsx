"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";

import { trackEvent } from "@/analytics/posthog-client";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { toSigaaIntegrationView } from "@/lib/client/sigaa/view-model";

import { getSigaaMenuStatus } from "./sigaa-menu-status-view";

type SigaaMenuStatusProps = Readonly<
  {
    location: "desktop_user_menu" | "mobile_user_menu";
    onNavigate?: () => void;
    variant?: "dropdown" | "mobile";
  } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onClick">
>;

export const SigaaMenuStatus = forwardRef<HTMLAnchorElement, SigaaMenuStatusProps>(
  function SigaaMenuStatus(
    { className: externalClassName, location, onNavigate, variant = "dropdown", ...linkProps },
    ref
  ) {
    const stateQuery = useOwnSigaaAcademicState();
    const view = stateQuery.isLoading
      ? "loading"
      : stateQuery.isError || !stateQuery.data
        ? "error"
        : toSigaaIntegrationView(stateQuery.data);
    const status = getSigaaMenuStatus(view);
    const Icon = status.icon;
    const toneClass =
      status.tone === "positive"
        ? "text-emerald-700 dark:text-emerald-300"
        : status.tone === "attention"
          ? "text-amber-700 dark:text-amber-300"
          : "text-muted-foreground";
    const className =
      variant === "mobile"
        ? "flex min-h-11 w-full items-center gap-2 rounded-md py-2 text-sm font-medium transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        : "flex min-h-11 cursor-pointer items-center";

    return (
      <Link
        {...linkProps}
        ref={ref}
        href="/perfil"
        className={`${className} ${toneClass} ${externalClassName ?? ""}`}
        onClick={() => {
          trackEvent("sigaa_entrypoint_clicked", {
            location,
            connection_state: status.connectionState,
          });
          onNavigate?.();
        }}
      >
        <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
        <span>{status.label}</span>
      </Link>
    );
  }
);
