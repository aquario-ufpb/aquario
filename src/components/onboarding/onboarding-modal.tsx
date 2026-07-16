"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "./onboarding-progress";
import { WelcomeStep } from "./steps/welcome-step";
import { PeriodoStep } from "./steps/periodo-step";
import { ConcluidasStep } from "./steps/concluidas-step";
import { CursandoStep } from "./steps/cursando-step";
import { TurmasStep } from "./steps/turmas-step";
import { EntidadesStep } from "./steps/entidades-step";
import { DoneStep } from "./steps/done-step";
import { useMyMemberships } from "@/lib/client/hooks";
import type { OnboardingStepId, OnboardingStep } from "@/lib/shared/types";
import type { SemestreLetivo } from "@/lib/shared/types/calendario.types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trackEvent } from "@/analytics/posthog-client";

type OnboardingModalProps = {
  currentStep: OnboardingStep;
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  onComplete: (stepId: OnboardingStepId) => Promise<void>;
  onSkip: (stepId: OnboardingStepId) => Promise<void>;
  isMutating: boolean;
  semestreAtivo?: SemestreLetivo;
  paasAvailable: boolean;
};

export function OnboardingModal({
  currentStep,
  steps,
  completedCount,
  totalCount,
  onComplete,
  onSkip,
  isMutating,
  semestreAtivo,
  paasAvailable,
}: OnboardingModalProps) {
  const [history, setHistory] = useState<OnboardingStepId[]>([]);
  const [viewingPastStep, setViewingPastStep] = useState<OnboardingStepId | null>(null);
  const [welcomePage, setWelcomePage] = useState<1 | 2>(1);
  const { data: memberships = [] } = useMyMemberships();

  const stepDefsRef = useRef<Map<OnboardingStepId, OnboardingStep>>(new Map());
  steps.forEach(s => stepDefsRef.current.set(s.id, s));

  const activeStepId = viewingPastStep ?? currentStep.id;
  const isRevisiting = viewingPastStep !== null;
  const activeStepDef = stepDefsRef.current.get(activeStepId) ?? currentStep;

  // Track whenever the visible step changes
  useEffect(() => {
    trackEvent("onboarding_step_viewed", { step_id: activeStepId });
  }, [activeStepId]);

  const handleComplete = useCallback(
    async (stepId: OnboardingStepId) => {
      if (isRevisiting) {
        setViewingPastStep(null);
        return;
      }
      trackEvent("onboarding_step_completed", { step_id: stepId });
      setHistory(prev => [...prev, stepId]);
      await onComplete(stepId);
    },
    [isRevisiting, onComplete]
  );

  const handleSkip = useCallback(
    async (stepId: OnboardingStepId) => {
      if (isRevisiting) {
        setViewingPastStep(null);
        return;
      }
      trackEvent("onboarding_step_skipped", { step_id: stepId });
      setHistory(prev => [...prev, stepId]);
      await onSkip(stepId);
    },
    [isRevisiting, onSkip]
  );

  const handleBack = useCallback(() => {
    // Handle welcome internal pages first
    if (activeStepId === "welcome" && welcomePage === 2) {
      setWelcomePage(1);
      return;
    }
    if (isRevisiting) {
      const idx = viewingPastStep ? history.indexOf(viewingPastStep) : -1;
      if (idx > 0) {
        setViewingPastStep(history[idx - 1]);
      } else {
        setViewingPastStep(null);
      }
      return;
    }
    if (history.length > 0) {
      setViewingPastStep(history[history.length - 1]);
    }
  }, [activeStepId, welcomePage, isRevisiting, viewingPastStep, history]);

  const canGoBack = (() => {
    if (activeStepId === "welcome" && welcomePage === 2) {
      return true;
    }
    if (isRevisiting) {
      const idx = viewingPastStep ? history.indexOf(viewingPastStep) : -1;
      return idx > 0;
    }
    return history.length > 0;
  })();

  const handleOpenChange = useCallback((_open: boolean) => {
    // Prevent closing
  }, []);

  const renderStep = (stepId: OnboardingStepId) => {
    switch (stepId) {
      case "welcome":
        return (
          <WelcomeStep
            page={welcomePage}
            onPageChange={setWelcomePage}
            onComplete={() => handleComplete("welcome")}
            isMutating={isMutating}
            semestreAtivo={semestreAtivo}
          />
        );
      case "periodo":
        return <PeriodoStep onComplete={() => handleComplete("periodo")} isMutating={isMutating} />;
      case "concluidas":
        return (
          <ConcluidasStep onComplete={() => handleComplete("concluidas")} isMutating={isMutating} />
        );
      case "cursando":
        return (
          <CursandoStep
            onComplete={() => handleComplete("cursando")}
            isMutating={isMutating}
            semestreNome={semestreAtivo?.nome}
          />
        );
      case "turmas":
        return (
          <TurmasStep
            onComplete={() => handleComplete("turmas")}
            isMutating={isMutating}
            paasAvailable={paasAvailable}
          />
        );
      case "entidades":
        return <EntidadesStep />;
      case "done":
        return <DoneStep onComplete={() => handleComplete("done")} isMutating={isMutating} />;
      default:
        return null;
    }
  };

  return (
    <DialogPrimitive.Root open={true} onOpenChange={handleOpenChange} modal={true}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-onboarding-overlay
          className="fixed inset-0 z-50 touch-none overscroll-none bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-onboarding-dialog
          onPointerDownOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
          className={cn(
            "fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] right-[max(0.5rem,env(safe-area-inset-right))] top-[max(0.5rem,env(safe-area-inset-top))] z-50",
            "flex min-h-0 w-auto max-w-6xl flex-col overflow-x-hidden overscroll-none rounded-lg border bg-background shadow-lg duration-200",
            "sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:h-[min(94dvh,56rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "motion-reduce:animate-none motion-reduce:transition-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Configuração do Aquário</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Complete os passos para configurar seu perfil do Aquário.
          </DialogPrimitive.Description>

          {/* Header — progress bar */}
          <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0">
            <OnboardingProgress currentStep={completedCount + 1} totalSteps={totalCount} />
          </div>

          {/* Scrollable step content */}
          <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-y-contain p-4 [scrollbar-gutter:stable] sm:p-6">
            <div
              className="flex min-h-full min-w-0 w-full flex-col justify-start animate-in fade-in duration-300 motion-reduce:animate-none motion-reduce:transition-none sm:justify-center"
              key={activeStepId}
            >
              {renderStep(activeStepId)}
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div className="flex shrink-0 items-center justify-between gap-2 rounded-b-lg border-t bg-background p-3 sm:p-4">
            <div>
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11 gap-1.5 text-muted-foreground"
                  onClick={handleBack}
                  disabled={isMutating}
                >
                  <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeStepId === "entidades" && !isRevisiting && (
                <Button
                  variant={memberships.length > 0 ? "default" : "ghost"}
                  size="sm"
                  className="min-h-11"
                  onClick={() =>
                    memberships.length > 0 ? handleComplete("entidades") : handleSkip("entidades")
                  }
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="w-4 h-4 animate-spin motion-reduce:animate-none"
                      />
                      <span className="sr-only">Salvando…</span>
                    </>
                  ) : memberships.length > 0 ? (
                    "Continuar"
                  ) : (
                    "Pular"
                  )}
                </Button>
              )}
              {activeStepDef.isSkippable && !isRevisiting && activeStepId !== "entidades" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-11"
                  onClick={() => handleSkip(activeStepId)}
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="w-4 h-4 animate-spin motion-reduce:animate-none"
                      />
                      <span className="sr-only">Salvando…</span>
                    </>
                  ) : (
                    "Pular"
                  )}
                </Button>
              )}
              {isRevisiting && (
                <Button
                  size="sm"
                  className="min-h-11"
                  onClick={() => setViewingPastStep(null)}
                  disabled={isMutating}
                >
                  Continuar
                </Button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
