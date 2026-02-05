import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { entidadesService } from "@/lib/client/api/entidades";
import { vagasService } from "@/lib/client/api/vagas";
import { queryKeys } from "@/lib/client/query-keys";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Hook to prefetch entidade data on hover
 * Usage: const prefetchEntidade = usePrefetchEntidade();
 *        <Link onMouseEnter={() => prefetchEntidade(slug)} ...>
 */
export const usePrefetchEntidade = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (slug: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.entidades.bySlug(slug),
        queryFn: () => entidadesService.getBySlug(slug),
        staleTime: FIVE_MINUTES,
      });
    },
    [queryClient]
  );
};

/**
 * Hook to prefetch vaga data on hover
 * Usage: const prefetchVaga = usePrefetchVaga();
 *        <Link onMouseEnter={() => prefetchVaga(id)} ...>
 */
export const usePrefetchVaga = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.vagas.byId(id),
        queryFn: () => vagasService.getById(id),
        staleTime: FIVE_MINUTES,
      });
    },
    [queryClient]
  );
};
