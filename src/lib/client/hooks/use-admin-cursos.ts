import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cursosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

const THIRTY_MINUTES = 30 * 60 * 1000;

export const useAllCursos = () => {
  return useQuery({
    queryKey: queryKeys.cursos.all,
    queryFn: cursosService.getAll,
    staleTime: THIRTY_MINUTES,
  });
};

export const useCreateCurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cursosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all });
    },
  });
};

export const useUpdateCurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nome: string; centroId: string } }) =>
      cursosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all });
    },
  });
};

export const useDeleteCurso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cursosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all });
    },
  });
};
