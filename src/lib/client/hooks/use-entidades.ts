import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entidadesService } from "@/lib/client/api/entidades";
import { queryKeys } from "@/lib/client/query-keys";
import { TipoEntidade } from "@/lib/shared/types/entidade.types";
import { useAuth } from "@/contexts/auth-context";

export const useEntidades = () => {
  return useQuery({
    queryKey: queryKeys.entidades.all,
    queryFn: () => entidadesService.getAll(),
  });
};

export const useEntidadeBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.entidades.bySlug(slug),
    queryFn: () => entidadesService.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useEntidadesByTipo = (tipo: TipoEntidade) => {
  return useQuery({
    queryKey: queryKeys.entidades.byTipo(tipo),
    queryFn: () => entidadesService.getByTipo(tipo),
    enabled: !!tipo,
  });
};

/**
 * Hook to add a member to an entidade
 * Returns a mutation that can be called with entidadeId and member data
 */
export const useAddEntidadeMember = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entidadeId,
      data,
    }: {
      entidadeId: string;
      data: {
        usuarioId: string;
        papel: "ADMIN" | "MEMBRO";
        startedAt?: string;
        endedAt?: string | null;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.addMember(entidadeId, data, token);
    },
    onSuccess: (_, variables) => {
      // Invalidate entidade queries to refetch with new member
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
      // Also invalidate by slug if we have it (we'll need to pass it or fetch it)
      // For now, invalidate all entidade queries
    },
  });
};
