"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { trackEvent } from "@/analytics/posthog-client";
import { SigaaConnectNudgeCard } from "@/components/sigaa/sigaa-connect-nudge-card";
import { useAuth } from "@/contexts/auth-context";
import { useOnboarding } from "@/lib/client/hooks/use-onboarding";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { resolveSigaaAccessState } from "@/lib/client/sigaa/access-state";
import {
  decideSigaaConnectNudge,
  getSigaaConnectNudgeConnectionState,
  readSigaaConnectNudgeDismissed,
  writeSigaaConnectNudgeDismissed,
} from "@/lib/client/sigaa/connect-nudge";
import { IS_DEV } from "@/lib/shared/config/env";

export function SigaaConnectNudgeProvider() {
  const pathname = usePathname();
  const auth = useAuth();
  const onboarding = useOnboarding();
  const sigaaQuery = useOwnSigaaAcademicState(auth.isAuthenticated);
  const accessState = resolveSigaaAccessState({
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
    isConnectionLoading: sigaaQuery.isLoading,
    isConnectionError: sigaaQuery.isError,
    importedState: sigaaQuery.data,
  });

  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [forcePreview, setForcePreview] = useState(false);
  const viewedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!IS_DEV) {
      return;
    }
    setForcePreview(new URLSearchParams(window.location.search).get("sigaaNudgePreview") === "1");
  }, [pathname]);

  useEffect(() => {
    if (!auth.userId) {
      setDismissed(false);
      return;
    }
    setDismissed(readSigaaConnectNudgeDismissed(auth.userId));
  }, [auth.userId]);

  const decision = decideSigaaConnectNudge({
    auth: { isAuthenticated: auth.isAuthenticated, isLoading: auth.isLoading },
    onboarding: { shouldShow: onboarding.shouldShow, isLoading: onboarding.isLoading },
    accessState,
    pathname,
    dismissed: dismissed === true,
  });
  const show = forcePreview || (decision.show && dismissed !== null);
  const connectionState =
    getSigaaConnectNudgeConnectionState(accessState) ??
    (forcePreview ? "never_connected" : null);

  useEffect(() => {
    if (!show || !connectionState || !auth.userId) {
      return;
    }
    if (viewedForUserRef.current === auth.userId) {
      return;
    }
    viewedForUserRef.current = auth.userId;
    trackEvent("sigaa_connect_nudge_viewed", { connection_state: connectionState });
  }, [auth.userId, connectionState, show]);

  const handleConnect = () => {
    if (!connectionState) {
      return;
    }
    trackEvent("sigaa_entrypoint_clicked", {
      location: "connect_nudge",
      connection_state: connectionState,
    });
  };

  const handleDismiss = () => {
    if (auth.userId) {
      writeSigaaConnectNudgeDismissed(auth.userId);
    }
    setDismissed(true);
    if (connectionState) {
      trackEvent("sigaa_connect_nudge_dismissed", { connection_state: connectionState });
    }
  };

  if (!show) {
    return null;
  }

  return <SigaaConnectNudgeCard onConnect={handleConnect} onDismiss={handleDismiss} />;
}
