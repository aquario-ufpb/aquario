"use client";

import { usePathname } from "next/navigation";
import { useOnboarding } from "@/lib/client/hooks/use-onboarding";
import { OnboardingModal } from "./onboarding-modal";

const AUTH_ROUTES: ReadonlySet<string> = new Set([
  "/login",
  "/registro",
  "/esqueci-senha",
  "/resetar-senha",
  "/verificar-email",
]);

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
