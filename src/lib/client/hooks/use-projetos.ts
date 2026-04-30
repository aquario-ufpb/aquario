import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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

type UseProjetosParams = {
  page?: number;
  limit?: number;
  search?: string;
  tipoEntidade?: string;
};

function buildProjetosQuery({ page, limit, search, tipoEntidade }: UseProjetosParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(page ?? 1));
  qs.set("limit", String(limit ?? 12));
  if (search?.trim()) {
    qs.set("search", search.trim());
  }
  if (tipoEntidade) {
    qs.set("tipoEntidade", tipoEntidade);
  }
  return qs.toString();
}

/**
 * Single-page projetos listing with server-side filters.
 * Use `useProjetosInfinite` for the infinite-scroll list page.
 */
export function useProjetos(params: UseProjetosParams = {}) {
  return useQuery({
    queryKey: [
      ...queryKeys.projetos.all,
      {
        page: params.page ?? 1,
        limit: params.limit ?? 12,
        search: params.search ?? "",
        tipoEntidade: params.tipoEntidade ?? "",
      },
    ],
    queryFn: async (): Promise<ProjetosListResponse> => {
      const res = await apiClient(`/projetos?${buildProjetosQuery(params)}`);
      if (!res.ok) {
        await throwApiError(res);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: prev => prev,
  });
}

type UseProjetosInfiniteParams = {
  search?: string;
  tipoEntidade?: string;
  pageSize?: number;
};

/**
 * Infinite-scroll projetos listing — fetches successive pages and concatenates them.
 * The query key includes search/tipoEntidade so filter changes reset the list.
 */
export function useProjetosInfinite(params: UseProjetosInfiniteParams = {}) {
  const { search, tipoEntidade, pageSize = 12 } = params;

  return useInfiniteQuery({
    queryKey: [
      ...queryKeys.projetos.all,
      "infinite",
      { search: search ?? "", tipoEntidade: tipoEntidade ?? "", pageSize },
    ],
    queryFn: async ({ pageParam = 1 }): Promise<ProjetosListResponse> => {
      const qs = buildProjetosQuery({
        page: pageParam,
        limit: pageSize,
        search,
        tipoEntidade,
      });
      const res = await apiClient(`/projetos?${qs}`);
      if (!res.ok) {
        await throwApiError(res);
      }
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
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
