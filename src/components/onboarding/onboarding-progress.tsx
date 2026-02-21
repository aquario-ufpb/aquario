"use client";

import { cn } from "@/lib/client/utils";

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Passo {currentStep} de {totalSteps}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < currentStep - 1
                ? "bg-aquario-primary"
                : i === currentStep - 1
                  ? "bg-aquario-primary/60"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
