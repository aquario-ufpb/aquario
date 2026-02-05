import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursoId = searchParams.get("cursoId");

    const { guiasRepository } = getContainer();

    const guias = cursoId
      ? await guiasRepository.findByCursoId(cursoId)
      : await guiasRepository.findMany();

    return NextResponse.json(guias);
  } catch {
    return ApiError.internal("Erro ao buscar guias");
  }
}
