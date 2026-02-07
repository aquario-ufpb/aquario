import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campusService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

const THIRTY_MINUTES = 30 * 60 * 1000;

export const useCampus = () => {
  return useQuery({
    queryKey: queryKeys.campus.all,
    queryFn: campusService.getAll,
    staleTime: THIRTY_MINUTES,
  });
};

export const useCreateCampus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campusService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campus.all });
    },
  });
};

export const useUpdateCampus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nome: string } }) =>
      campusService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campus.all });
    },
  });
};

export const useDeleteCampus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campusService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campus.all });
    },
  });
};
