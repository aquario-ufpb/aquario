import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { cursosRepository } = getContainer();
    const cursos = await cursosRepository.findAll();
    return NextResponse.json(cursos);
  } catch {
    return ApiError.internal("Erro ao buscar cursos");
  }
}

export function POST(request: Request) {
  return withAdmin(request, async req => {
    const body = await req.json();
    const { nome, centroId } = body;

    if (!nome?.trim() || !centroId) {
      return ApiError.badRequest("Nome e centroId são obrigatórios");
    }

    const { cursosRepository } = getContainer();
    const curso = await cursosRepository.create({ nome: nome.trim(), centroId });
    return NextResponse.json(curso, { status: 201 });
  });
}
