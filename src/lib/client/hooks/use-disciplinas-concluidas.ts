import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosService } from "@/lib/client/api/usuarios";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";

/**
 * Hook to fetch the current user's completed disciplines
 */
export const useDisciplinasConcluidas = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.disciplinasConcluidas.me,
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.getMyDisciplinasConcluidas(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to update the current user's completed disciplines
 */
export const useUpdateDisciplinasConcluidas = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disciplinaIds: string[]) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.updateMyDisciplinasConcluidas(token, disciplinaIds);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.disciplinasConcluidas.me, data);
    },
  });
};
