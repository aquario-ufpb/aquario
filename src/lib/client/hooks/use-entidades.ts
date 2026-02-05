import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entidadesService } from "@/lib/client/api/entidades";
import { queryKeys } from "@/lib/client/query-keys";
import { TipoEntidade } from "@/lib/shared/types/entidade.types";
import { useAuth } from "@/contexts/auth-context";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useEntidades = () => {
  return useQuery({
    queryKey: queryKeys.entidades.all,
    queryFn: () => entidadesService.getAll(),
    staleTime: FIVE_MINUTES,
  });
};

export const useEntidadeBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.entidades.bySlug(slug),
    queryFn: () => entidadesService.getBySlug(slug),
    enabled: !!slug,
    staleTime: FIVE_MINUTES,
  });
};

export const useEntidadesByTipo = (tipo: TipoEntidade) => {
  return useQuery({
    queryKey: queryKeys.entidades.byTipo(tipo),
    queryFn: () => entidadesService.getByTipo(tipo),
    enabled: !!tipo,
    staleTime: FIVE_MINUTES,
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
        cargoId?: string | null;
        startedAt?: string;
        endedAt?: string | null;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.addMember(entidadeId, data, token);
    },
    onSuccess: (_, _variables) => {
      // Invalidate entidade queries to refetch with new member
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
      // Also invalidate by slug if we have it (we'll need to pass it or fetch it)
      // For now, invalidate all entidade queries
    },
  });
};

/**
 * Hook to update a member's membership
 */
export const useUpdateEntidadeMember = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entidadeId,
      membroId,
      data,
    }: {
      entidadeId: string;
      membroId: string;
      data: {
        papel?: "ADMIN" | "MEMBRO";
        cargoId?: string | null;
        startedAt?: string;
        endedAt?: string | null;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.updateMember(entidadeId, membroId, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
    },
  });
};

/**
 * Hook to delete a member from an entidade
 */
export const useDeleteEntidadeMember = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entidadeId, membroId }: { entidadeId: string; membroId: string }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.deleteMember(entidadeId, membroId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
    },
  });
};

/**
 * Hook to fetch cargos for an entidade
 */
export const useEntidadeCargos = (entidadeId: string) => {
  return useQuery({
    queryKey: queryKeys.entidades.cargos(entidadeId),
    queryFn: () => entidadesService.getCargos(entidadeId),
    enabled: !!entidadeId,
  });
};

/**
 * Hook to create a cargo
 */
export const useCreateCargo = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entidadeId,
      data,
    }: {
      entidadeId: string;
      data: {
        nome: string;
        descricao?: string | null;
        ordem?: number;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.createCargo(entidadeId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.cargos(variables.entidadeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
    },
  });
};

/**
 * Hook to update a cargo
 */
export const useUpdateCargo = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entidadeId,
      cargoId,
      data,
    }: {
      entidadeId: string;
      cargoId: string;
      data: {
        nome?: string;
        descricao?: string | null;
        ordem?: number;
      };
    }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.updateCargo(entidadeId, cargoId, data, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.cargos(variables.entidadeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
    },
  });
};

/**
 * Hook to delete a cargo
 */
export const useDeleteCargo = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entidadeId, cargoId }: { entidadeId: string; cargoId: string }) => {
      if (!token) {
        throw new Error("No token available");
      }
      return entidadesService.deleteCargo(entidadeId, cargoId, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.cargos(variables.entidadeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
    },
  });
};
