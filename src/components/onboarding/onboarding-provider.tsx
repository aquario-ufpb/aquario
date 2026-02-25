"use client";

import { useOnboarding } from "@/lib/client/hooks/use-onboarding";
import { OnboardingModal } from "./onboarding-modal";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <>
      {children}
      {onboarding.shouldShow && onboarding.currentStep && (
        <OnboardingModal
          currentStep={onboarding.currentStep}
          steps={onboarding.steps}
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
