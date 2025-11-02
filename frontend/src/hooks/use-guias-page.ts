import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGuias } from "./use-guias";
import { guiasService } from "../lib/api";
import { queryKeys } from "../lib/query-keys";
import { GuiaTree, Secao, SubSecao } from "../lib/types";

export const useGuiasPage = (cursoSlug: string) => {
  // Map curso slug to name
  const cursoSlugToNome = useMemo(
    () => ({
      "ciencia-da-computacao": "Ciência da Computação",
      "engenharia-da-computacao": "Engenharia da Computação",
      "ciencias-de-dados-e-inteligencia-artificial": "Ciências de Dados e Inteligência Artificial",
    }),
    []
  );

  // Hardcoded cursos - no backend dependency
  const cursos = [
    { id: "ciencia-da-computacao", nome: "Ciência da Computação", centroId: "ci" },
    { id: "engenharia-da-computacao", nome: "Engenharia da Computação", centroId: "ci" },
    {
      id: "ciencias-de-dados-e-inteligencia-artificial",
      nome: "Ciências de Dados e Inteligência Artificial",
      centroId: "ci",
    },
  ];

  // Find the specific curso
  const curso = cursos.find(
    c => c.nome === cursoSlugToNome[cursoSlug as keyof typeof cursoSlugToNome]
  );

  const { data: guias, isLoading: guiasLoading, error: guiasError } = useGuias(cursoSlug);

  // Fetch all sections for all guias using useQueries
  const secoesQueries = useQuery({
    queryKey: queryKeys.guias.secoes(cursoSlug || "none"),
    queryFn: async () => {
      if (!guias) {
        return {};
      }

      const secoesMap: Record<string, Secao[]> = {};
      for (const guia of guias) {
        const secoes = await guiasService.getSecoes(guia.slug, cursoSlug); // Pass course context
        secoesMap[guia.slug] = secoes;
      }
      return secoesMap;
    },
    enabled: !!guias && guias.length > 0,
  });

  // Fetch all subsections for all sections
  const subSecoesQueries = useQuery({
    queryKey: queryKeys.guias.subSecoes(cursoSlug || "none"),
    queryFn: async () => {
      if (!secoesQueries.data) {
        return {};
      }

      const subSecoesMap: Record<string, SubSecao[]> = {};
      for (const guiaSlug in secoesQueries.data) {
        const secoes = secoesQueries.data[guiaSlug];
        for (const secao of secoes) {
          const subSecoes = await guiasService.getSubSecoes(secao.slug, cursoSlug); // Pass course context
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
    curso,
    isLoading,
    error,
    cursoSlugToNome,
    secoesData: secoesQueries.data,
    subSecoesData: subSecoesQueries.data,
  };
};
