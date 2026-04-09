import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { queryKeys } from "@/lib/client/query-keys";
import type { ProjetoWithRelations, ProjetosListResponse } from "@/lib/shared/types/projeto";

type FetchProjetosParams = {
  entidadeId?: string;
  usuarioId?: string;
  limit?: number;
};

async function fetchProjetos({
  entidadeId,
  usuarioId,
  limit = 50,
}: FetchProjetosParams): Promise<ProjetoWithRelations[]> {
  const params = new URLSearchParams();

  if (entidadeId) {
    params.append("entidadeId", entidadeId);
  }

  if (usuarioId) {
    params.append("usuarioId", usuarioId);
  }

  params.append("limit", limit.toString());

  const res = await apiClient(`/projetos?${params.toString()}`);

  if (!res.ok) {
    await throwApiError(res);
  }

  const data = await res.json();
  return data.projetos as ProjetoWithRelations[];
}

// Projetos de uma entidade
export function useProjetosByEntidade(entidadeId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byEntidade(entidadeId ?? ""),
    queryFn: () => fetchProjetos({ entidadeId }),
    enabled: !!entidadeId,
    staleTime: 5 * 60 * 1000,
  });
}

// Projetos de um usuário (autor principal ou colaborador)
export function useProjetosByUsuario(usuarioId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byUsuario(usuarioId ?? ""),
    queryFn: () => fetchProjetos({ usuarioId }),
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
}

// Projetos de uma entidade onde o usuário participa
export function useProjetosDaEntidadeDoUsuario(entidadeId?: string, usuarioId?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.byEntidadeUsuario(entidadeId ?? "", usuarioId ?? ""),
    queryFn: () =>
      fetchProjetos({
        entidadeId,
        usuarioId,
      }),
    enabled: !!entidadeId && !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
}

// Lista paginada de todos os projetos publicados
export function useProjetos() {
  return useQuery({
    queryKey: queryKeys.projetos.all,
    queryFn: async (): Promise<ProjetosListResponse> => {
      const res = await apiClient("/projetos");
      if (!res.ok) {
        await throwApiError(res);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Um projeto específico pelo slug
export function useProjetoBySlug(slug?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.bySlug(slug ?? ""),
    queryFn: async (): Promise<ProjetoWithRelations> => {
      const res = await apiClient(`/projetos/${slug}`);
      if (!res.ok) {
        await throwApiError(res);
      }
      return res.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
