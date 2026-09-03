import { useMemo } from "react";

import type { GradeCurricularResponse } from "@/lib/shared/types";
import { projectSigaaOnboardingSuggestions } from "@/lib/shared/sigaa/project-onboarding-suggestions";

import { useDisciplinasConcluidas } from "./use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "./use-disciplinas-semestre";
import { useOwnSigaaAcademicState } from "./use-sigaa";

export const useSigaaOnboardingSuggestions = (
  grade: GradeCurricularResponse | undefined,
  activeSemester: string | null,
  sigaaEnabled: boolean
) => {
  const sigaaQuery = useOwnSigaaAcademicState(sigaaEnabled);
  const shouldLoadManualState = sigaaEnabled && Boolean(sigaaQuery.data?.snapshot);
  const completedQuery = useDisciplinasConcluidas(shouldLoadManualState);
  const enrolledQuery = useDisciplinasSemestreAtivo(shouldLoadManualState);

  const suggestions = useMemo(() => {
    const snapshot = sigaaQuery.data?.snapshot?.payload;
    if (!snapshot || !grade || !completedQuery.data || !enrolledQuery.data) {
      return null;
    }

    return projectSigaaOnboardingSuggestions({
      snapshot,
      activeSemester,
      catalog: grade.disciplinas.map(discipline => ({
        disciplinaId: discipline.disciplinaId,
        code: discipline.codigo,
        name: discipline.nome,
      })),
      manual: [
        ...completedQuery.data.disciplinas.map(discipline => ({
          ...discipline,
          state: "completed" as const,
        })),
        ...enrolledQuery.data.disciplinas.map(discipline => ({
          disciplinaId: discipline.disciplinaId,
          code: discipline.disciplinaCodigo,
          name: discipline.disciplinaNome,
          state: "enrolled" as const,
        })),
      ],
    });
  }, [
    activeSemester,
    completedQuery.data,
    enrolledQuery.data,
    grade,
    sigaaQuery.data?.snapshot?.payload,
  ]);

  return {
    suggestions,
    hasSnapshot: Boolean(sigaaQuery.data?.snapshot),
    isLoading:
      (sigaaEnabled && sigaaQuery.isLoading) ||
      (shouldLoadManualState && (completedQuery.isLoading || enrolledQuery.isLoading)),
  };
};
