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
    const { nome, centroId } = body;

    if (!nome?.trim() || !centroId) {
      return ApiError.badRequest("Nome e centroId são obrigatórios");
    }

    const { cursosRepository } = getContainer();
    const curso = await cursosRepository.update(id, { nome: nome.trim(), centroId });
    if (!curso) {
      return ApiError.notFound("Curso");
    }

    return NextResponse.json(curso);
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const { cursosRepository } = getContainer();

    const curso = await cursosRepository.findById(id);
    if (!curso) {
      return ApiError.notFound("Curso");
    }

    const deps = await cursosRepository.countDependencies(id);
    const parts: string[] = [];
    if (deps.curriculos > 0) {
      parts.push(`${deps.curriculos} currículo(s)`);
    }
    if (deps.guias > 0) {
      parts.push(`${deps.guias} guia(s)`);
    }
    if (deps.usuarios > 0) {
      parts.push(`${deps.usuarios} usuário(s)`);
    }
    if (parts.length > 0) {
      return ApiError.conflict(
        `Não é possível excluir: existem ${parts.join(", ")} vinculado(s)`,
        ErrorCode.HAS_DEPENDENCIES
      );
    }

    await cursosRepository.delete(id);
    return NextResponse.json({ success: true });
  });
}
