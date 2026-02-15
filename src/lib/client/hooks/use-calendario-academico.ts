import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarioAcademicoService } from "@/lib/client/api/calendario-academico";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";
import type { CategoriaEvento } from "@/lib/shared/types/calendario.types";

const FIVE_MINUTES = 5 * 60 * 1000;

// =========================================================================
// Query Hooks
// =========================================================================

export const useSemestres = () => {
  return useQuery({
    queryKey: queryKeys.calendarioAcademico.all,
    queryFn: () => calendarioAcademicoService.getAllSemestres(),
    staleTime: FIVE_MINUTES,
  });
};

export const useSemestreAtivo = () => {
  return useQuery({
    queryKey: queryKeys.calendarioAcademico.ativo,
    queryFn: () => calendarioAcademicoService.getSemestreAtivo(),
    staleTime: FIVE_MINUTES,
  });
};

export const useSemestre = (id: string) => {
  return useQuery({
    queryKey: queryKeys.calendarioAcademico.byId(id),
    queryFn: () => calendarioAcademicoService.getSemestreById(id),
    enabled: !!id,
    staleTime: FIVE_MINUTES,
  });
};

export const useEventos = (semestreId: string) => {
  return useQuery({
    queryKey: queryKeys.calendarioAcademico.eventos(semestreId),
    queryFn: () => calendarioAcademicoService.getEventos(semestreId),
    enabled: !!semestreId,
    staleTime: FIVE_MINUTES,
  });
};

// =========================================================================
// Mutation Hooks
// =========================================================================

export const useCreateSemestre = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nome: string; dataInicio: string; dataFim: string }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.createSemestre(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarioAcademico.all });
    },
  });
};

export const useUpdateSemestre = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { nome?: string; dataInicio?: string; dataFim?: string };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.updateSemestre(id, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarioAcademico.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarioAcademico.byId(variables.id) });
    },
  });
};

export const useDeleteSemestre = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.deleteSemestre(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendarioAcademico.all });
    },
  });
};

export const useCreateEvento = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semestreId,
      data,
    }: {
      semestreId: string;
      data: {
        descricao: string;
        dataInicio: string;
        dataFim: string;
        categoria: CategoriaEvento;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.createEvento(semestreId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.byId(variables.semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.eventos(variables.semestreId),
      });
    },
  });
};

export const useBatchCreateEventos = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semestreId,
      data,
    }: {
      semestreId: string;
      data: {
        eventos: Array<{
          descricao: string;
          dataInicio: string;
          dataFim: string;
          categoria: CategoriaEvento;
        }>;
        replace: boolean;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.batchCreateEventos(semestreId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.byId(variables.semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.eventos(variables.semestreId),
      });
    },
  });
};

export const useUpdateEvento = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      semestreId,
      eventoId,
      data,
    }: {
      semestreId: string;
      eventoId: string;
      data: {
        descricao?: string;
        dataInicio?: string;
        dataFim?: string;
        categoria?: CategoriaEvento;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.updateEvento(semestreId, eventoId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.byId(variables.semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.eventos(variables.semestreId),
      });
    },
  });
};

export const useDeleteEvento = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ semestreId, eventoId }: { semestreId: string; eventoId: string }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return calendarioAcademicoService.deleteEvento(semestreId, eventoId, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.byId(variables.semestreId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.calendarioAcademico.eventos(variables.semestreId),
      });
    },
  });
};
