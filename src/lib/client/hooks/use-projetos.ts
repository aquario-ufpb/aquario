import { useQuery, useInfiniteQuery, useQueries } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import {
  fetchProjetos,
  getProjetoBySlug,
  getSimilarProjetos,
  listProjetos,
  type ProjetoOrder,
  type ProjetoOrderBy,
  type ProjetoStatus,
} from "@/lib/client/api/projetos";

export type { ProjetoOrder, ProjetoOrderBy, ProjetoStatus };

// Projetos de uma entidade — accepts optional status filter (admins want drafts/arquivados)
export function useProjetosByEntidade(entidadeId?: string, status?: ProjetoStatus) {
  return useQuery({
    queryKey: [...queryKeys.projetos.byEntidade(entidadeId ?? ""), { status: status ?? "" }],
    queryFn: () => fetchProjetos({ entidadeId, status }),
    enabled: !!entidadeId,
    staleTime: 5 * 60 * 1000,
  });
}

// Projetos de um usuário (autor principal ou colaborador) — accepts status for own profile.
export function useProjetosByUsuario(usuarioId?: string, status?: ProjetoStatus) {
  return useQuery({
    queryKey: [...queryKeys.projetos.byUsuario(usuarioId ?? ""), { status: status ?? "" }],
    queryFn: () => fetchProjetos({ usuarioId, status }),
    enabled: !!usuarioId,
    staleTime: 5 * 60 * 1000,
  });
}

type UseProjetosInfiniteParams = {
  search?: string;
  tipoEntidade?: string;
  status?: ProjetoStatus;
  orderBy?: ProjetoOrderBy;
  order?: ProjetoOrder;
  scopedToMe?: boolean;
  pageSize?: number;
};

/**
 * Infinite-scroll projetos listing — fetches successive pages and concatenates them.
 * The query key includes filters/sort/scoping so any change resets the list.
 */
export function useProjetosInfinite(params: UseProjetosInfiniteParams = {}) {
  const { search, tipoEntidade, status, orderBy, order, scopedToMe, pageSize = 12 } = params;

  return useInfiniteQuery({
    queryKey: [
      ...queryKeys.projetos.all,
      "infinite",
      {
        search: search ?? "",
        tipoEntidade: tipoEntidade ?? "",
        status: status ?? "PUBLICADO",
        orderBy: orderBy ?? "dataInicio",
        order: order ?? "desc",
        scopedToMe: !!scopedToMe,
        pageSize,
      },
    ],
    queryFn: ({ pageParam = 1 }) =>
      listProjetos({
        page: pageParam,
        limit: pageSize,
        search,
        tipoEntidade,
        status,
        orderBy,
        order,
        scopedToMe,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Per-status totals for the /projetos status tab strip. Returns 4 buckets:
 *
 * - publicadoGlobal: total PUBLICADO across the platform. Drives the "Publicados"
 *   tab count (for everyone) and the listing for non-admin browsing.
 * - publicadoMeus: PUBLICADO scoped to caller — projects they author or are admin
 *   of an entidade-author for. Drives the "Meus Publicados" tab; if 0 we hide
 *   the tab entirely (the user has no publishing surface to disambiguate).
 * - rascunho / arquivado: caller-scoped (server enforces). MASTER_ADMINs see
 *   global totals here, since the server doesn't auto-scope them for non-PUBLICADO.
 *
 * Returns 0s when not authenticated.
 */
export function useUserProjetoCounts(usuarioId: string | undefined, isMasterAdmin: boolean) {
  const enabled = !!usuarioId;

  const queries = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.projetos.all, "statusCount", { status: "PUBLICADO", scope: "ALL" }],
        queryFn: async () => {
          const data = await listProjetos({ page: 1, limit: 1, status: "PUBLICADO" });
          return data.pagination.total;
        },
        staleTime: 60 * 1000,
      },
      {
        queryKey: [
          ...queryKeys.projetos.all,
          "statusCount",
          { status: "PUBLICADO", scope: "ME", usuarioId: usuarioId ?? "" },
        ],
        queryFn: async () => {
          if (!usuarioId) {
            return 0;
          }
          const data = await listProjetos({
            page: 1,
            limit: 1,
            status: "PUBLICADO",
            scopedToMe: true,
          });
          return data.pagination.total;
        },
        enabled,
        staleTime: 60 * 1000,
      },
      {
        queryKey: [
          ...queryKeys.projetos.all,
          "statusCount",
          {
            status: "RASCUNHO",
            scope: isMasterAdmin ? "ALL" : "ME",
            usuarioId: isMasterAdmin ? "" : (usuarioId ?? ""),
          },
        ],
        queryFn: async () => {
          if (!usuarioId) {
            return 0;
          }
          // Pass scopedToMe explicitly for non-master users instead of relying
          // on the server's auto-scoping branch — keeps the intent local and
          // robust if that branch ever changes.
          const data = await listProjetos({
            page: 1,
            limit: 1,
            status: "RASCUNHO",
            scopedToMe: !isMasterAdmin,
          });
          return data.pagination.total;
        },
        enabled,
        staleTime: 60 * 1000,
      },
      {
        queryKey: [
          ...queryKeys.projetos.all,
          "statusCount",
          {
            status: "ARQUIVADO",
            scope: isMasterAdmin ? "ALL" : "ME",
            usuarioId: isMasterAdmin ? "" : (usuarioId ?? ""),
          },
        ],
        queryFn: async () => {
          if (!usuarioId) {
            return 0;
          }
          const data = await listProjetos({
            page: 1,
            limit: 1,
            status: "ARQUIVADO",
            scopedToMe: !isMasterAdmin,
          });
          return data.pagination.total;
        },
        enabled,
        staleTime: 60 * 1000,
      },
    ],
  });

  return {
    publicadoGlobal: queries[0].data ?? 0,
    publicadoMeus: queries[1].data ?? 0,
    rascunho: queries[2].data ?? 0,
    arquivado: queries[3].data ?? 0,
    isLoading: queries.some(q => q.isLoading),
  };
}

/**
 * Per-status totals for a specific usuarioId — drives status tabs on the
 * user profile page. Only meaningful for the profile owner: the server
 * blocks non-PUBLICADO listings unless the caller can see them, so passing
 * `enabled` requires the caller and target ids to match (or master admin).
 */
export function useUsuarioProjetoCounts(usuarioId: string | undefined, enabled: boolean) {
  const statuses = ["PUBLICADO", "RASCUNHO", "ARQUIVADO"] as const;

  const queries = useQueries({
    queries: statuses.map(status => ({
      queryKey: [
        ...queryKeys.projetos.all,
        "usuarioStatusCount",
        { usuarioId: usuarioId ?? "", status },
      ],
      queryFn: async () => {
        if (!usuarioId) {
          return 0;
        }
        const data = await listProjetos({ page: 1, limit: 1, status, usuarioId });
        return data.pagination.total;
      },
      // PUBLICADO is always public; RASCUNHO/ARQUIVADO require auth as the user.
      enabled: !!usuarioId && (status === "PUBLICADO" || enabled),
      staleTime: 60 * 1000,
    })),
  });

  return {
    publicado: queries[0].data ?? 0,
    rascunho: queries[1].data ?? 0,
    arquivado: queries[2].data ?? 0,
    isLoading: queries.some(q => q.isLoading),
  };
}

/**
 * Per-status totals for an entidade — drives status tabs on the entidade
 * profile page when the caller is admin of the entidade. Non-admin callers
 * will get 401s on RASCUNHO/ARQUIVADO from the server, so only enable when
 * the caller can see them.
 */
export function useEntidadeProjetoCounts(entidadeId: string | undefined, canSeeAll: boolean) {
  const enabled = !!entidadeId;
  const statuses = ["PUBLICADO", "RASCUNHO", "ARQUIVADO"] as const;

  const queries = useQueries({
    queries: statuses.map(status => ({
      queryKey: [
        ...queryKeys.projetos.all,
        "entidadeStatusCount",
        { entidadeId: entidadeId ?? "", status },
      ],
      queryFn: async () => {
        if (!entidadeId) {
          return 0;
        }
        const data = await listProjetos({ page: 1, limit: 1, status, entidadeId });
        return data.pagination.total;
      },
      // PUBLICADO is always public; RASCUNHO/ARQUIVADO require canSeeAll.
      enabled: enabled && (status === "PUBLICADO" || canSeeAll),
      staleTime: 60 * 1000,
    })),
  });

  return {
    publicado: queries[0].data ?? 0,
    rascunho: queries[1].data ?? 0,
    arquivado: queries[2].data ?? 0,
    isLoading: queries.some(q => q.isLoading),
  };
}

// Um projeto específico pelo slug
export function useProjetoBySlug(slug?: string) {
  return useQuery({
    queryKey: queryKeys.projetos.bySlug(slug ?? ""),
    queryFn: () => getProjetoBySlug(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Server-ranked similar projetos for the given source slug.
export function useSimilarProjetos(slug?: string, limit = 4) {
  return useQuery({
    queryKey: [...queryKeys.projetos.bySlug(slug ?? ""), "similar", limit],
    queryFn: () => getSimilarProjetos(slug as string, limit),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
