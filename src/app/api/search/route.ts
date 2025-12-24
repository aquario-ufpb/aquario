import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: "entidade" | "guia" | "secao" | "subsecao" | "mapa" | "page";
  title: string;
  description?: string;
  url: string;
  category?: string;
};

// Static pages that can be searched
const STATIC_PAGES = [
  {
    id: "sobre",
    title: "Sobre",
    description: "Informações sobre o Aquário e o Centro de Informática da UFPB",
    url: "/sobre",
    keywords: ["sobre", "info", "informacao", "informacoes", "aquario", "ci"],
  },
  {
    id: "calendario",
    title: "Calendário",
    description: "Visualização de horários e eventos",
    url: "/calendario",
    keywords: ["calendario", "horario", "horarios", "evento", "eventos", "agenda"],
  },
  {
    id: "ferramentas",
    title: "Ferramentas",
    description: "Ferramentas úteis para estudantes",
    url: "/ferramentas",
    keywords: ["ferramentas", "tools", "utilidades"],
  },
  {
    id: "mapas",
    title: "Mapas",
    description: "Localização de salas e prédios",
    url: "/mapas",
    keywords: ["mapas", "mapa", "sala", "salas", "predio", "predios", "localizacao"],
  },
  {
    id: "guias",
    title: "Guias",
    description: "Documentação e tutoriais para cursos",
    url: "/guias",
    keywords: ["guias", "guia", "tutorial", "tutoriais", "documentacao", "doc", "ajuda"],
  },
  {
    id: "entidades",
    title: "Entidades",
    description: "Laboratórios, ligas, grupos e empresas parceiras",
    url: "/entidades",
    keywords: ["entidades", "entidade", "laboratorio", "liga", "grupo", "empresa"],
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text) {
    return false;
  }
  return normalizeText(text).includes(normalizeText(query));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];
  const { entidadesRepository, guiasRepository, secoesGuiaRepository, subSecoesGuiaRepository } =
    getContainer();

  try {
    // Search Entidades
    // TODO: Optimize with database-level search (LIKE/ILIKE) to avoid loading all records
    const entidades = await entidadesRepository.findMany();
    entidades.forEach(entidade => {
      if (
        matchesQuery(entidade.nome, query) ||
        matchesQuery(entidade.descricao, query) ||
        matchesQuery(entidade.subtitle, query)
      ) {
        results.push({
          id: entidade.id,
          type: "entidade",
          title: entidade.nome,
          description: entidade.descricao || entidade.subtitle || undefined,
          url: `/entidade/${entidade.id}`,
          category: "Entidades",
        });
      }
    });

    // Search Guias, Secoes, and SubSecoes
    // TODO: Optimize N+1 query pattern by fetching related data in fewer queries
    const guias = await guiasRepository.findMany();
    for (const guia of guias) {
      // Search in Guia title and description
      if (matchesQuery(guia.titulo, query) || matchesQuery(guia.descricao, query)) {
        results.push({
          id: guia.id,
          type: "guia",
          title: guia.titulo,
          description: guia.descricao || undefined,
          url: `/guias/${guia.slug}`,
          category: "Guias",
        });
      }

      // Search in Secoes
      const secoes = await secoesGuiaRepository.findByGuiaId(guia.id);
      for (const secao of secoes) {
        if (matchesQuery(secao.titulo, query) || matchesQuery(secao.conteudo, query)) {
          results.push({
            id: secao.id,
            type: "secao",
            title: `${guia.titulo} / ${secao.titulo}`,
            description: secao.conteudo?.substring(0, 150) || undefined,
            url: `/guias/${guia.slug}/${secao.slug}`,
            category: "Guias",
          });
        }

        // Search in SubSecoes
        const subsecoes = await subSecoesGuiaRepository.findBySecaoId(secao.id);
        for (const subsecao of subsecoes) {
          if (matchesQuery(subsecao.titulo, query) || matchesQuery(subsecao.conteudo, query)) {
            results.push({
              id: subsecao.id,
              type: "subsecao",
              title: `${guia.titulo} / ${secao.titulo} / ${subsecao.titulo}`,
              description: subsecao.conteudo?.substring(0, 150) || undefined,
              url: `/guias/${guia.slug}/${secao.slug}/${subsecao.slug}`,
              category: "Guias",
            });
          }
        }
      }
    }

    // Search static pages
    STATIC_PAGES.forEach(page => {
      if (
        matchesQuery(page.title, query) ||
        matchesQuery(page.description, query) ||
        page.keywords.some(keyword => matchesQuery(keyword, query))
      ) {
        results.push({
          id: page.id,
          type: "page",
          title: page.title,
          description: page.description,
          url: page.url,
          category: "Páginas",
        });
      }
    });

    // Limit results to 50
    const limitedResults = results.slice(0, 50);

    return NextResponse.json({ results: limitedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error", results: [] }, { status: 500 });
  }
}
