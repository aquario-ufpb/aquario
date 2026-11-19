"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { POSTHOG_KEY, POSTHOG_VERBOSE, IS_DEV, IS_PROD } from "@/lib/shared/config/env";

function isEmailActionPage(pathname: string) {
  return /^\/(resetar-senha|verificar-email)\/?$/.test(pathname);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const emailActionPage = isEmailActionPage(usePathname());
  const initialized = useRef(false);
  const [replayPaused, setReplayPaused] = useState(false);

  useLayoutEffect(() => {
    if (!initialized.current) {
      return;
    }
    if (emailActionPage && !replayPaused) {
      posthog.stopSessionRecording();
      setReplayPaused(true);
    } else if (!emailActionPage && replayPaused) {
      posthog.startSessionRecording();
      setReplayPaused(false);
    }
  }, [emailActionPage, replayPaused]);

  useEffect(() => {
    // Only initialize PostHog in production with a valid key
    if (IS_PROD && POSTHOG_KEY && !initialized.current && !emailActionPage) {
      initialized.current = true;
      posthog.init(POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        // The optional tours bundle ships its own copy of DOMPurify.
        disable_product_tours: true,
        before_send: event => (isEmailActionPage(window.location.pathname) ? null : event),
        mask_personal_data_properties: true,
        custom_personal_data_properties: ["token"],
        disable_capture_url_hashes: true,
        session_recording: {
          blockSelector: ".ph-no-capture, [data-ph-no-capture='true']",
          maskCapturedNetworkRequestFn: request => {
            if (isEmailActionPage(window.location.pathname)) {
              return null;
            }
            try {
              return isEmailActionPage(new URL(request.name, window.location.href).pathname)
                ? null
                : request;
            } catch {
              return null;
            }
          },
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
  }, [emailActionPage]);

  // Only wrap with PostHogProvider if in production with a key
  if (IS_DEV || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  // The recorder buffers frames. Mount the private screen only after it has stopped.
  const waitingForReplayStop = emailActionPage && initialized.current && !replayPaused;
  return <PHProvider client={posthog}>{waitingForReplayStop ? null : children}</PHProvider>;
}
