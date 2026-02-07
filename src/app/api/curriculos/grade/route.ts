import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursoId = searchParams.get("cursoId");

  if (!cursoId) {
    return ApiError.badRequest("cursoId é obrigatório");
  }

  const { curriculosRepository } = getContainer();
  const grade = await curriculosRepository.findActiveGradeByCursoId(cursoId);

  if (!grade) {
    return ApiError.notFound("Currículo ativo");
  }

  return NextResponse.json(grade);
}
