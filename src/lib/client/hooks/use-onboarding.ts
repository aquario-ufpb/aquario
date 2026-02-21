"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { queryKeys } from "@/lib/client/query-keys";
import { usuariosService } from "@/lib/client/api/usuarios";
import type {
  OnboardingMetadata,
  OnboardingStep,
  OnboardingStepId,
  OnboardingStatus,
} from "@/lib/shared/types";
import { useSemestreAtivo } from "./use-calendario-academico";
import { useCurrentUser } from "./use-usuarios";
import { usePaasCalendar } from "./use-paas-calendar";
import { useMemo, useCallback } from "react";

const STEP_DEFINITIONS: Record<
  OnboardingStepId,
  { title: string; description: string; isSkippable: boolean }
> = {
  welcome: {
    title: "Bem-vindo ao Aquário!",
    description: "Vamos configurar seu perfil do Aquário.",
    isSkippable: false,
  },
  periodo: {
    title: "Período Atual",
    description: "Selecione o período que você está cursando.",
    isSkippable: true,
  },
  concluidas: {
    title: "Disciplinas Concluídas",
    description: "Selecione as disciplinas que você já concluiu.",
    isSkippable: true,
  },
  cursando: {
    title: "Disciplinas do Semestre",
    description: "Selecione as disciplinas que está cursando.",
    isSkippable: true,
  },
  turmas: {
    title: "Turmas",
    description: "Selecione suas turmas para montar seu horário.",
    isSkippable: true,
  },
  entidades: {
    title: "Entidades",
    description: "Informe de quais entidades você faz ou já fez parte.",
    isSkippable: true,
  },
  done: {
    title: "Tudo pronto!",
    description: "Seu perfil está configurado.",
    isSkippable: false,
  },
};

export const useOnboarding = () => {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: user } = useCurrentUser();
  const { data: semestreAtivo } = useSemestreAtivo();
  const { data: paasData } = usePaasCalendar(user?.centro?.sigla);

  const {
    data: metadata,
    isLoading: isMetadataLoading,
    isFetched: isMetadataFetched,
  } = useQuery({
    queryKey: queryKeys.usuarios.onboarding,
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.getOnboardingMetadata(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<OnboardingMetadata>) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.updateOnboardingMetadata(data, token);
    },
    onSuccess: updated => {
      queryClient.setQueryData(queryKeys.usuarios.onboarding, updated);
    },
  });

  // Determine PAAS availability
  const paasSemestreNome = paasData?.description;
  const dbSemestreNome = semestreAtivo?.nome;
  const paasAvailable = !!(
    paasSemestreNome &&
    dbSemestreNome &&
    paasSemestreNome === dbSemestreNome
  );

  const status: OnboardingStatus = useMemo(() => {
    if (!metadata || !isMetadataFetched) {
      return {
        isComplete: true,
        currentStep: null,
        steps: [],
        completedCount: 0,
        totalCount: 0,
      };
    }

    const m = metadata as OnboardingMetadata;
    const semNome = semestreAtivo?.nome;
    const semesterMeta = semNome ? m.semesters?.[semNome] : undefined;

    // Build the full list of relevant steps (both completed and pending)
    const allSteps: OnboardingStep[] = [];

    // 1. Welcome (always relevant)
    allSteps.push({
      id: "welcome",
      ...STEP_DEFINITIONS.welcome,
      isCompleted: !!m.welcome,
    });

    // 2. Período (one-time, auto-detect if user already has periodoAtual)
    const hasPeriodo = !!user?.periodoAtual;
    if (!hasPeriodo || m.periodo) {
      allSteps.push({
        id: "periodo",
        ...STEP_DEFINITIONS.periodo,
        isCompleted: !!m.periodo || hasPeriodo,
      });
    }

    // 3. Concluídas (one-time)
    allSteps.push({
      id: "concluidas",
      ...STEP_DEFINITIONS.concluidas,
      isCompleted: !!m.concluidas,
    });

    // 4. Cursando (per-semester)
    if (semNome) {
      allSteps.push({
        id: "cursando",
        ...STEP_DEFINITIONS.cursando,
        isCompleted: !!semesterMeta?.cursando,
      });
    }

    // 5. Turmas (per-semester, only if cursando is done/skipped and PAAS available)
    if (semNome && semesterMeta?.cursando && paasAvailable) {
      allSteps.push({
        id: "turmas",
        ...STEP_DEFINITIONS.turmas,
        isCompleted: !!semesterMeta?.turmas,
      });
    }

    // 6. Entidades (one-time)
    allSteps.push({
      id: "entidades",
      ...STEP_DEFINITIONS.entidades,
      isCompleted: !!m.entidades,
    });

    // 7. Done (one-time, final screen)
    allSteps.push({
      id: "done",
      ...STEP_DEFINITIONS.done,
      isCompleted: !!m.done,
    });

    const pendingSteps = allSteps.filter(s => !s.isCompleted);
    const completedCount = allSteps.filter(s => s.isCompleted).length;

    return {
      isComplete: pendingSteps.length === 0,
      currentStep: pendingSteps[0] ?? null,
      steps: pendingSteps,
      completedCount,
      totalCount: allSteps.length,
    };
  }, [metadata, isMetadataFetched, semestreAtivo?.nome, user?.periodoAtual, paasAvailable]);

  const completeStep = useCallback(
    async (stepId: OnboardingStepId) => {
      const now = new Date().toISOString();
      const semNome = semestreAtivo?.nome;

      if (stepId === "welcome") {
        await updateMutation.mutateAsync({ welcome: { completedAt: now } });
      } else if (stepId === "periodo") {
        await updateMutation.mutateAsync({ periodo: { completedAt: now } });
      } else if (stepId === "concluidas") {
        await updateMutation.mutateAsync({ concluidas: { completedAt: now } });
      } else if (stepId === "cursando" && semNome) {
        await updateMutation.mutateAsync({
          semesters: { [semNome]: { cursando: { completedAt: now } } },
        });
      } else if (stepId === "turmas" && semNome) {
        await updateMutation.mutateAsync({
          semesters: { [semNome]: { turmas: { completedAt: now } } },
        });
      } else if (stepId === "entidades") {
        await updateMutation.mutateAsync({ entidades: { completedAt: now } });
      } else if (stepId === "done") {
        await updateMutation.mutateAsync({ done: { completedAt: now } });
      }
    },
    [updateMutation, semestreAtivo?.nome]
  );

  const skipStep = useCallback(
    async (stepId: OnboardingStepId) => {
      const now = new Date().toISOString();
      const semNome = semestreAtivo?.nome;

      if (stepId === "periodo") {
        await updateMutation.mutateAsync({ periodo: { skippedAt: now } });
      } else if (stepId === "concluidas") {
        await updateMutation.mutateAsync({ concluidas: { skippedAt: now } });
      } else if (stepId === "cursando" && semNome) {
        await updateMutation.mutateAsync({
          semesters: { [semNome]: { cursando: { skippedAt: now } } },
        });
      } else if (stepId === "turmas" && semNome) {
        await updateMutation.mutateAsync({
          semesters: { [semNome]: { turmas: { skippedAt: now } } },
        });
      } else if (stepId === "entidades") {
        await updateMutation.mutateAsync({ entidades: { skippedAt: now } });
      }
    },
    [updateMutation, semestreAtivo?.nome]
  );

  const isLoading = isAuthLoading || isMetadataLoading;
  const shouldShow = isAuthenticated && !isLoading && isMetadataFetched && !status.isComplete;

  return {
    ...status,
    completeStep,
    skipStep,
    isLoading,
    shouldShow,
    isMutating: updateMutation.isPending,
    semestreAtivo,
    paasAvailable,
  };
};
