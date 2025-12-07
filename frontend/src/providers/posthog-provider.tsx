"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
const enableVerbose = process.env.NEXT_PUBLIC_POSTHOG_VERBOSE === "true";
const isDev = process.env.NODE_ENV === "development";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog in production (not in dev mode)
    if (!isDev && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        debug: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loaded: (client: any) => {
          if (enableVerbose) {
            client.debug();
          }
        },
      });
    }
  }, []);

  // Only wrap with PostHogProvider if not in dev mode
  if (isDev || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
