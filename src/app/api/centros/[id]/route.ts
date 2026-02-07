import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { ErrorCode } from "@/lib/shared/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

type RouteContext = { params: Promise<{ id: string }> };

export function PUT(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    const { id } = await context.params;
    const body = await req.json();
    const { nome, sigla, descricao, campusId } = body;

    if (!nome?.trim() || !sigla?.trim()) {
      return ApiError.badRequest("Nome e sigla são obrigatórios");
    }

    const { centrosRepository } = getContainer();
    const centro = await centrosRepository.update(id, {
      nome: nome.trim(),
      sigla: sigla.trim(),
      descricao: descricao?.trim() || null,
      campusId,
    });
    if (!centro) {
      return ApiError.notFound("Centro");
    }

    return NextResponse.json(centro);
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const { centrosRepository } = getContainer();

    const centro = await centrosRepository.findById(id);
    if (!centro) {
      return ApiError.notFound("Centro");
    }

    const deps = await centrosRepository.countDependencies(id);
    if (deps.cursos > 0) {
      return ApiError.conflict(
        `Não é possível excluir: existem ${deps.cursos} curso(s) vinculado(s)`,
        ErrorCode.HAS_DEPENDENCIES
      );
    }

    await centrosRepository.delete(id);
    return NextResponse.json({ success: true });
  });
}
