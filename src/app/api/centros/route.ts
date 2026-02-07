import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { centrosRepository } = getContainer();
    const centros = await centrosRepository.findMany();

    return NextResponse.json(centros);
  } catch {
    return ApiError.internal("Erro ao buscar centros");
  }
}

export function POST(request: Request) {
  return withAdmin(request, async req => {
    const body = await req.json();
    const { nome, sigla, descricao, campusId } = body;

    if (!nome?.trim() || !sigla?.trim() || !campusId) {
      return ApiError.badRequest("Nome, sigla e campusId são obrigatórios");
    }

    const { centrosRepository } = getContainer();
    const centro = await centrosRepository.create({
      nome: nome.trim(),
      sigla: sigla.trim(),
      descricao: descricao?.trim() || null,
      campusId,
    });
    return NextResponse.json(centro, { status: 201 });
  });
}
