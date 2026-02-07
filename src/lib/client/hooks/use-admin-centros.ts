import { useMutation, useQueryClient } from "@tanstack/react-query";
import { centrosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

// Re-export useCentros for the query
export { useCentros } from "./use-centros";

export const useCreateCentro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: centrosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centros.all });
    },
  });
};

export const useUpdateCentro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { nome: string; sigla: string; descricao: string | null; campusId?: string };
    }) => centrosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centros.all });
    },
  });
};

export const useDeleteCentro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: centrosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centros.all });
    },
  });
};
