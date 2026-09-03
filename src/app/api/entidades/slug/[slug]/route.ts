import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { formatPublicEntidadeResponse } from "@/lib/server/utils/format-entidade-response";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { entidadesRepository } = getContainer();

    const entidade = await entidadesRepository.findBySlug(slug);

    if (!entidade) {
      return ApiError.entidadeNotFound();
    }

    return NextResponse.json(formatPublicEntidadeResponse(entidade));
  } catch {
    return ApiError.internal("Erro ao buscar entidade");
  }
}
