import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { searchStaticPages } from "@/lib/server/search/static-pages";
import { ApiError } from "@/lib/server/errors";
import type { SearchResponse } from "@/lib/shared/types/search.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=term&limit=5
 * Unified search across all entity categories. Public endpoint.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

    if (!query || query.length < 3) {
      const empty: SearchResponse = {
        query: query || "",
        results: {
          paginas: [],
          guias: [],
          entidades: [],
          vagas: [],
          disciplinas: [],
          cursos: [],
          usuarios: [],
        },
      };
      return NextResponse.json(empty);
    }

    const container = getContainer();
    const repo = container.searchRepository;

    const [paginas, guias, entidades, vagas, disciplinas, cursos, usuarios] =
      await Promise.all([
        searchStaticPages(query, limit),
        repo.searchGuias(query, limit),
        repo.searchEntidades(query, limit),
        repo.searchVagas(query, limit),
        repo.searchDisciplinas(query, limit),
        repo.searchCursos(query, limit),
        repo.searchUsuarios(query, limit),
      ]);

    const response: SearchResponse = {
      query,
      results: { paginas, guias, entidades, vagas, disciplinas, cursos, usuarios },
    };

    return NextResponse.json(response);
  } catch {
    return ApiError.internal("Erro ao realizar busca");
  }
}
