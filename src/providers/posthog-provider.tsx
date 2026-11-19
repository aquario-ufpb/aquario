"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { POSTHOG_KEY, POSTHOG_VERBOSE, IS_DEV, IS_PROD } from "@/lib/shared/config/env";

function isEmailActionPage() {
  return /^\/(resetar-senha|verificar-email)\/?$/.test(window.location.pathname);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialized = useRef(false);
  useEffect(() => {
    // Only initialize PostHog in production with a valid key
    if (IS_PROD && POSTHOG_KEY && !initialized.current && !isEmailActionPage()) {
      initialized.current = true;
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        before_send: event => (isEmailActionPage() ? null : event),
        mask_personal_data_properties: true,
        custom_personal_data_properties: ["token"],
        disable_capture_url_hashes: true,
        session_recording: {
          blockSelector: ".ph-no-capture, [data-ph-no-capture='true']",
          maskAllInputs: true,
          recordBody: false,
          recordHeaders: false,
        },
        debug: false,
        loaded: client => {
          if (POSTHOG_VERBOSE) {
            client.debug();
          }
        },
      });
    }
  }, [pathname]);

  // Only wrap with PostHogProvider if in production with a key
  if (IS_DEV || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
