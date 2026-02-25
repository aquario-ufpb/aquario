export type OnboardingStepId =
  | "welcome"
  | "periodo"
  | "concluidas"
  | "cursando"
  | "turmas"
  | "entidades"
  | "done";

export type SemesterStepState = {
  completedAt?: string;
  skippedAt?: string;
};

export type OnboardingMetadata = {
  /** One-time steps — once done, never shown again */
  welcome?: { completedAt: string };
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
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
};
