import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGuias } from "./use-guias";
import { guiasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";
import { GuiaTree, Secao, SubSecao } from "@/lib/shared/types";

export const useGuiasPage = () => {
  const { data: guias, isLoading: guiasLoading, error: guiasError } = useGuias();

  // Fetch all sections for all guias using useQueries
  const secoesQueries = useQuery({
    queryKey: queryKeys.guias.secoes("all"),
    queryFn: async () => {
      if (!guias) {
        return {};
      }

      const secoesMap: Record<string, Secao[]> = {};
      for (const guia of guias) {
        const secoes = await guiasService.getSecoes(guia.slug);
        secoesMap[guia.slug] = secoes;
      }
      return secoesMap;
    },
    enabled: !!guias && guias.length > 0,
  });

  // Fetch all subsections for all sections
  const subSecoesQueries = useQuery({
    queryKey: queryKeys.guias.subSecoes("all"),
    queryFn: async () => {
      if (!secoesQueries.data) {
        return {};
      }

      const subSecoesMap: Record<string, SubSecao[]> = {};
      for (const guiaSlug in secoesQueries.data) {
        const secoes = secoesQueries.data[guiaSlug];
        for (const secao of secoes) {
          const subSecoes = await guiasService.getSubSecoes(secao.slug);
          subSecoesMap[secao.slug] = subSecoes;
        }
      }
      return subSecoesMap;
    },
    enabled: !!secoesQueries.data,
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
