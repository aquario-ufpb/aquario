export type OnboardingStepId =
  | "welcome"
  | "sigaa"
  | "periodo"
  | "concluidas"
  | "cursando"
  | "turmas"
  | "entidades"
  | "done";

type SemesterStepState = {
  completedAt?: string;
  skippedAt?: string;
};

export type OnboardingMetadata = {
  /** Selects the onboarding policy without changing legacy in-progress flows. */
  flowVersion?: 2;

  /** One-time steps — once done, never shown again */
  welcome?: { completedAt: string };
  sigaa?: { completedAt?: string; skippedAt?: string };
  periodo?: { completedAt?: string; skippedAt?: string };
  concluidas?: { completedAt?: string; skippedAt?: string };
  entidades?: { completedAt?: string; skippedAt?: string };
  done?: { completedAt: string };

  /** Per-semester steps — keyed by semestreLetivo nome (e.g. "2025.1") */
  semesters?: Record<
    string,
    {
      cursando?: SemesterStepState;
      turmas?: SemesterStepState;
    }
  >;
};

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  isCompleted: boolean;
  isSkippable: boolean;
};

export type OnboardingStatus = {
  isComplete: boolean;
  currentStep: OnboardingStep | null;
  /** Pending steps only (forward path). */
  steps: OnboardingStep[];
  /** Full ordered flow, including completed steps — used for progress + Voltar after reload. */
  allSteps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
};
