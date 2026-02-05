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
    const { cursosRepository } = getContainer();
    const cursos = await cursosRepository.findByCentroId(id);

    return NextResponse.json(cursos);
  } catch {
    return ApiError.internal("Erro ao buscar cursos");
  }
}
