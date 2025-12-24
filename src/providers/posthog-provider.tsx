"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { POSTHOG_KEY, POSTHOG_VERBOSE, IS_DEV, IS_PROD } from "@/lib/shared/config/env";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog in production with a valid key
    if (IS_PROD && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loaded: (client: any) => {
          if (POSTHOG_VERBOSE) {
            client.debug();
          }
        },
      });
    }
  }, []);

  // Only wrap with PostHogProvider if in production with a key
  if (IS_DEV || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
