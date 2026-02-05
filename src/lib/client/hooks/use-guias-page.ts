import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGuias } from "./use-guias";
import { guiasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";
import { GuiaTree, Secao, SubSecao } from "@/lib/shared/types";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useGuiasPage = () => {
  const { data: guias, isLoading: guiasLoading, error: guiasError } = useGuias();

  // Fetch all sections for all guias in parallel using Promise.all
  const secoesQueries = useQuery({
    queryKey: queryKeys.guias.secoes("all"),
    queryFn: async () => {
      if (!guias) {
        return {};
      }

      // Fetch all sections in parallel instead of sequentially
      const results = await Promise.all(
        guias.map(async guia => {
          const secoes = await guiasService.getSecoes(guia.slug);
          return { slug: guia.slug, secoes };
        })
      );

      // Build the map from results
      const secoesMap: Record<string, Secao[]> = {};
      for (const { slug, secoes } of results) {
        secoesMap[slug] = secoes;
      }
      return secoesMap;
    },
    enabled: !!guias && guias.length > 0,
    staleTime: FIVE_MINUTES,
  });

  // Fetch all subsections for all sections in parallel
  const subSecoesQueries = useQuery({
    queryKey: queryKeys.guias.subSecoes("all"),
    queryFn: async () => {
      if (!secoesQueries.data) {
        return {};
      }

      // Collect all sections from all guias
      const allSections: Secao[] = [];
      for (const guiaSlug in secoesQueries.data) {
        allSections.push(...secoesQueries.data[guiaSlug]);
      }

      // Fetch all subsections in parallel instead of sequentially
      const results = await Promise.all(
        allSections.map(async secao => {
          const subSecoes = await guiasService.getSubSecoes(secao.slug);
          return { slug: secao.slug, subSecoes };
        })
      );

      // Build the map from results
      const subSecoesMap: Record<string, SubSecao[]> = {};
      for (const { slug, subSecoes } of results) {
        subSecoesMap[slug] = subSecoes;
      }
      return subSecoesMap;
    },
    enabled: !!secoesQueries.data,
    staleTime: FIVE_MINUTES,
  });

  // Build the complete guia tree with ALL data
  const guiaTree: GuiaTree[] = useMemo(() => {
    if (!guias || !secoesQueries.data || !subSecoesQueries.data) {
      return [];
    }

    return guias.map(guia => {
      const secoes = secoesQueries.data[guia.slug] || [];

      return {
        titulo: guia.titulo,
        slug: guia.slug,
        secoes: secoes.map(secao => {
          const subSecoes = subSecoesQueries.data[secao.slug] || [];

          return {
            titulo: secao.titulo,
            slug: secao.slug,
            subsecoes: subSecoes.map(sub => ({
              titulo: sub.titulo,
              slug: sub.slug,
            })),
          };
        }),
      };
    });
  }, [guias, secoesQueries.data, subSecoesQueries.data]);

  // Determine loading and error states
  const isLoading = guiasLoading || secoesQueries.isLoading || subSecoesQueries.isLoading;

  const error = guiasError || secoesQueries.error || subSecoesQueries.error;

  return {
    guiaTree,
    isLoading,
    error,
    secoesData: secoesQueries.data,
    subSecoesData: subSecoesQueries.data,
  };
};
