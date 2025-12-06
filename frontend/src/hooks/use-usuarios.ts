import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosService } from "../lib/api/usuarios";
import { queryKeys } from "../lib/query-keys";
import { useAuth } from "../contexts/auth-context";

/**
 * Hook to get the current authenticated user
 * Uses the token from auth context automatically
 */
export const useCurrentUser = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.usuarios.current,
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.getCurrentUser(token);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
  });
};

/**
 * Hook to list all users (admin only)
 * Uses the token from auth context automatically
 */
export const useUsuarios = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.usuarios.all,
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.listUsers(token);
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds - user list might change more frequently
  });
};

/**
 * Hook to update a user's role (admin only)
 * Returns a mutation that can be called with userId and newRole
 */
export const useUpdateUserRole = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      papelPlataforma,
    }: {
      userId: string;
      papelPlataforma: "USER" | "MASTER_ADMIN";
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.updateUserRole(userId, papelPlataforma, token);
    },
    onSuccess: () => {
      // Invalidate and refetch users list after role update
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
      // Also invalidate current user if it was the updated user
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
    },
  });
};
