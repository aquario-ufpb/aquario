import { normalizeCurriculumCode } from "@/lib/shared/sigaa/curriculum-code";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursoId = searchParams.get("cursoId");
  const codigo = searchParams.get("codigo");

  if (!cursoId) {
    return ApiError.badRequest("cursoId é obrigatório");
  }

  const { curriculosRepository } = getContainer();
  if (codigo && codigo.length > 64) {
    return ApiError.badRequest("Código de currículo inválido");
  }
  const grade = codigo
    ? await curriculosRepository.findActiveGradeByCursoId(cursoId, normalizeCurriculumCode(codigo))
    : await curriculosRepository.findActiveGradeByCursoId(cursoId);

  if (!grade) {
    return ApiError.notFound("Currículo ativo");
  }

  return NextResponse.json(grade);
}
