import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuariosService, type UpdateUserInfoRequest } from "@/lib/client/api/usuarios";
import { queryKeys } from "@/lib/client/query-keys";
import { useAuth } from "@/contexts/auth-context";

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
 * Hook to get a user by slug
 */
export const useUsuarioBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.usuarios.bySlug(slug),
    queryFn: () => usuariosService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes - user profile data doesn't change often
  });
};

/**
 * Hook to list users with pagination (admin only)
 */
export const useUsuariosPaginated = (options: {
  page?: number;
  limit?: number;
  filter?: "all" | "facade" | "real";
  search?: string;
}) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.usuarios.paginated(options),
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.listUsersPaginated(token, options);
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to search users (for autocomplete/search)
 */
export const useSearchUsers = (query: string, limit?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.usuarios.search(query, limit),
    queryFn: async () => {
      if (!token) {
        throw new Error("No token available");
      }
      if (!query.trim()) {
        return { users: [], pagination: { page: 1, limit: limit || 10, total: 0, totalPages: 0 } };
      }
      return await usuariosService.searchUsers(token, query, limit);
    },
    enabled: !!token && !!query.trim(),
    staleTime: 10 * 1000, // 10 seconds for search results
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

/**
 * Hook to delete a user (admin only)
 * Returns a mutation that can be called with userId
 */
export const useDeleteUser = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.deleteUser(userId, token);
    },
    onSuccess: () => {
      // Invalidate and refetch users list after deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
    },
  });
};

/**
 * Hook to upload a profile photo
 * The upload route now handles both upload and database update atomically
 * Automatically invalidates and refetches current user data
 */
export const useUploadPhoto = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      if (!token) {
        throw new Error("No token available");
      }
      // Upload route now returns the updated user object directly
      return usuariosService.uploadPhoto(file, token);
    },
    onSuccess: updatedUser => {
      // Update the cache directly with the new user data (includes new photo URL)
      queryClient.setQueryData(queryKeys.usuarios.current, updatedUser);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
    },
  });
};

/**
 * Hook to delete a profile photo
 * Automatically updates cache and refetches current user data
 */
export const useDeletePhoto = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.deletePhoto(token);
    },
    onSuccess: updatedUser => {
      // Update the cache directly with the new user data (photo removed)
      queryClient.setQueryData(queryKeys.usuarios.current, updatedUser);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
    },
  });
};

/**
 * Hook to create a facade user (admin only)
 * Returns a mutation that can be called with nome, centroId, and cursoId
 */
export const useCreateFacadeUser = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nome: string; centroId: string; cursoId: string }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.createFacadeUser(data, token);
    },
    onSuccess: () => {
      // Invalidate and refetch users list after creating facade user
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
    },
  });
};

export const useUpdateUserInfo = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserInfoRequest }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.updateUserInfo(userId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
    },
  });
};

export const useUpdateUserSlug = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, slug }: { userId: string; slug: string | null }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.updateUserSlug(userId, slug, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
    },
  });
};

/**
 * Hook to get the current user's entity memberships
 */
export const useMyMemberships = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.usuarios.currentMemberships,
    queryFn: () => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.getMyMemberships(token);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get a user's entity memberships by user ID
 */
export const useUserMemberships = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.usuarios.memberships(userId),
    queryFn: () => usuariosService.getUserMemberships(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to merge a facade user's memberships into a real user (admin only)
 */
export const useMergeFacadeUser = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { facadeUserId: string; realUserId: string; deleteFacade: boolean }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return usuariosService.mergeFacadeUser(
        data.facadeUserId,
        data.realUserId,
        data.deleteFacade,
        token
      );
    },
    onSuccess: () => {
      // Invalidate and refetch users list after merging
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all });
    },
  });
};
