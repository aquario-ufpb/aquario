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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
          className={cn(
            "fixed left-2 right-2 top-[50%] z-50 w-auto translate-y-[-50%] border bg-background shadow-lg duration-200 rounded-lg",
            "sm:left-[50%] sm:right-auto sm:w-full sm:-translate-x-1/2",
            "max-w-6xl h-[94vh] flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <DialogPrimitive.Title className="sr-only">Configuração do Aquário</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Complete os passos para configurar seu perfil do Aquário.
          </DialogPrimitive.Description>

          {/* Header — progress bar */}
          <div className="p-6 pb-0">
            <OnboardingProgress currentStep={completedCount + 1} totalSteps={totalCount} />
          </div>

          {/* Scrollable step content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div
              className="animate-in fade-in duration-300 w-full min-h-full flex flex-col justify-center"
              key={activeStepId}
            >
              {renderStep(activeStepId)}
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div className="border-t bg-background p-4 flex items-center justify-between gap-2 rounded-b-lg">
            <div>
              {canGoBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={handleBack}
                  disabled={isMutating}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeStepId === "entidades" && !isRevisiting && (
                <Button
                  variant={memberships.length > 0 ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    memberships.length > 0 ? handleComplete("entidades") : handleSkip("entidades")
                  }
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
                  onClick={() => handleSkip(activeStepId)}
                  disabled={isMutating}
                >
                  {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pular"}
                </Button>
              )}
              {isRevisiting && (
                <Button size="sm" onClick={() => setViewingPastStep(null)} disabled={isMutating}>
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
