import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { disciplinaSemestreService } from "@/lib/client/api/disciplina-semestre";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";
import type {
  MarcarDisciplinasRequest,
  PatchDisciplinaSemestreRequest,
  DisciplinaSemestreResponse,
} from "@/lib/shared/types";

/**
 * Fetch the current user's enrolled disciplines for the active semester.
 */
export const useDisciplinasSemestreAtivo = () => {
  const { token, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.disciplinasSemestre.ativo(userId),
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return disciplinaSemestreService.getByActiveSemestre(token);
    },
    enabled: !!token && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Mark disciplines as concluida / cursando / none.
 * Invalidates both concluidas and semestre caches on success.
 */
export const useMarcarDisciplinas = () => {
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarcarDisciplinasRequest) => {
      if (!token) {
        throw new Error("No token available");
      }
      return disciplinaSemestreService.marcarDisciplinas(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disciplinasConcluidas.me(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.disciplinasSemestre.ativo(userId) });
    },
  });
};

/**
 * Patch turma details on a single DisciplinaSemestre record.
 */
export const usePatchDisciplinaSemestre = () => {
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      disciplinaSemestreId,
      data,
    }: {
      disciplinaSemestreId: string;
      data: PatchDisciplinaSemestreRequest;
    }): Promise<DisciplinaSemestreResponse> => {
      if (!token) {
        throw new Error("No token available");
      }
      return disciplinaSemestreService.patchDisciplinaSemestre(
        "ativo",
        disciplinaSemestreId,
        data,
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.disciplinasSemestre.ativo(userId) });
    },
  });
};

/**
 * Search disciplines by code or name.
 */
export const useSearchDisciplinas = (query: string) => {
  return useQuery({
    queryKey: queryKeys.disciplinas.search(query),
    queryFn: () => disciplinaSemestreService.searchDisciplinas(query),
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
};
