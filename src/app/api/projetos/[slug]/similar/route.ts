import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 12;

/**
 * GET /api/projetos/[slug]/similar?limit=4
 * Public — returns up to `limit` PUBLICADO projetos similar to the source,
 * ranked by shared autores and tags. Source must itself be PUBLICADO; non-public
 * projetos return 404 to avoid leaking their existence.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT)
    );

    const { projetosRepository } = getContainer();
    const source = await projetosRepository.findBySlug(slug);
    if (!source || source.status !== "PUBLICADO") {
      return ApiError.notFound("Projeto");
    }

    const similar = await projetosRepository.findSimilar(source.id, limit);
    return NextResponse.json({ projetos: similar });
  } catch (error) {
    console.error("Error fetching similar projetos:", error);
    return ApiError.internal("Erro ao buscar projetos similares");
  }
}
