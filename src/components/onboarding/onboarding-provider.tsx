"use client";

import { usePathname } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/client/auth-routes";
import { useOnboarding } from "@/lib/client/hooks/use-onboarding";
import { OnboardingModal } from "./onboarding-modal";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onboarding = useOnboarding();
  const canShowOnboarding = !AUTH_ROUTES.has(pathname);

  return (
    <>
      {children}
      {canShowOnboarding && onboarding.shouldShow && onboarding.currentStep && (
        <OnboardingModal
          currentStep={onboarding.currentStep}
          steps={onboarding.steps}
          allSteps={onboarding.allSteps}
          completedCount={onboarding.completedCount}
          totalCount={onboarding.totalCount}
          onComplete={onboarding.completeStep}
          onSkip={onboarding.skipStep}
          isMutating={onboarding.isMutating}
          semestreAtivo={onboarding.semestreAtivo ?? undefined}
          paasAvailable={onboarding.paasAvailable}
        />
      )}
    </>
  );
}
