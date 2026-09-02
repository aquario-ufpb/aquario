"use client";

import { cn } from "@/lib/client/utils";

type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
  /** Short label for the active etapa (e.g. "Introdução", "SIGAA"). */
  stepTitle: string;
  /**
   * Optional page progress inside a multi-screen etapa (welcome has 2 pages).
   * Keeps totalSteps unchanged while giving forward-motion feedback.
   */
  subStep?: Readonly<{ current: number; total: number }>;
};

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepTitle,
  subStep,
}: OnboardingProgressProps) {
  const safeStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const subCurrent = subStep
    ? Math.min(Math.max(subStep.current, 1), Math.max(subStep.total, 1))
    : 1;
  const subTotal = subStep ? Math.max(subStep.total, 1) : 1;
  const subProgress = subStep ? subCurrent / subTotal : 1;

  const label = `Etapa ${safeStep} de ${totalSteps}`;
  const valueText = subStep
    ? `${label} · ${stepTitle} (${subCurrent} de ${subTotal})`
    : `${label} · ${stepTitle}`;

  return (
    <div
      className="space-y-3"
      role="progressbar"
      aria-label="Progresso da configuração"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={safeStep}
      aria-valuetext={valueText}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="min-w-0 text-muted-foreground">
          <span>{label}</span>
          <span className="text-muted-foreground/50" aria-hidden="true">
            {" · "}
          </span>
          <span className="font-medium text-foreground">{stepTitle}</span>
        </p>
        {subStep ? (
          <div
            className="flex shrink-0 items-center gap-1.5"
            aria-hidden="true"
            title={`Página ${subCurrent} de ${subTotal}`}
          >
            {Array.from({ length: subTotal }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none",
                  i < subCurrent ? "bg-aquario-primary" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < safeStep - 1;
          const isCurrent = i === safeStep - 1;

          if (isCompleted) {
            return <div key={i} className="h-1.5 flex-1 rounded-full bg-aquario-primary" />;
          }

          if (isCurrent) {
            return (
              <div key={i} className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-aquario-primary/70 transition-[width] duration-200 ease-out motion-reduce:transition-none"
                  style={{ width: `${Math.max(subProgress, 0.28) * 100}%` }}
                />
              </div>
            );
          }

          return <div key={i} className="h-1.5 flex-1 rounded-full bg-muted" />;
        })}
      </div>
    </div>
  );
}
