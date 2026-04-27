import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export const STEPS = [
  { title: "Informações básicas", phrase: "Jogando a isca..." },
  { title: "Descrição", phrase: "Mergulhando nos detalhes..." },
  { title: "Processo seletivo", phrase: "Montando a rede..." },
  { title: "Revisão", phrase: "Quase na superfície!" },
] as const;

export function VagaProgress({ currentStep }: { currentStep: number }) {
  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Passo {currentStep + 1} de {STEPS.length}
        </span>
        <span className="text-muted-foreground italic">{step.phrase}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < currentStep
                ? "bg-aquario-primary"
                : i === currentStep
                  ? "bg-aquario-primary/60"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

type VagaStepperProps = {
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  children: React.ReactNode;
};

export function VagaStepper({
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  error,
  children,
}: VagaStepperProps) {
  const isLastStep = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col gap-8">
      {/* Step title */}
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
      </div>

      {/* Step content */}
      <div className="animate-in fade-in duration-300" key={currentStep}>
        {children}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div>
          {currentStep > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
        </div>
        <div>
          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="rounded-full gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar vaga"
              )}
            </Button>
          ) : (
            <Button type="button" onClick={onNext} disabled={isSubmitting} className="gap-1.5">
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
