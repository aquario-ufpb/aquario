import { useQuery } from "@tanstack/react-query";
import { usuariosService } from "@/lib/client/api/usuarios";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";

/**
 * Hook to fetch the current user's completed disciplines
 */
export const useDisciplinasConcluidas = () => {
  const { token, userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.disciplinasConcluidas.me(userId),
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.getMyDisciplinasConcluidas(token);
    },
    enabled: !!token && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
