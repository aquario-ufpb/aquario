import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { secoesGuiaRepository } = getContainer();

    const secoes = await secoesGuiaRepository.findByGuiaId(id);

    return NextResponse.json(secoes);
  } catch {
    return ApiError.internal("Erro ao buscar seções");
  }
}
