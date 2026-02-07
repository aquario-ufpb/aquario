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
    const { nome } = body;

    if (!nome?.trim()) {
      return ApiError.badRequest("Nome é obrigatório");
    }

    const { campusRepository } = getContainer();
    const campus = await campusRepository.update(id, { nome: nome.trim() });
    if (!campus) {
      return ApiError.notFound("Campus");
    }

    return NextResponse.json(campus);
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async () => {
    const { id } = await context.params;
    const { campusRepository } = getContainer();

    const campus = await campusRepository.findById(id);
    if (!campus) {
      return ApiError.notFound("Campus");
    }

    const deps = await campusRepository.countDependencies(id);
    if (deps.centros > 0) {
      return ApiError.conflict(
        `Não é possível excluir: existem ${deps.centros} centro(s) vinculado(s)`,
        ErrorCode.HAS_DEPENDENCIES
      );
    }

    await campusRepository.delete(id);
    return NextResponse.json({ success: true });
  });
}
