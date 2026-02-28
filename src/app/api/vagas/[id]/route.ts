import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { withAuth, canManageVagaForEntidade } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { mapVagaToJson } from "@/lib/server/utils/vaga-mapper";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { vagasRepository } = getContainer();
    const vaga = await vagasRepository.findById(id);
    if (!vaga) {
      return ApiError.notFound("Vaga");
    }
    return NextResponse.json(mapVagaToJson(vaga));
  } catch {
    return ApiError.internal("Erro ao buscar vaga");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  return await withAuth(request, async (_req, usuario) => {
    try {
      const { id } = await context.params;
      const { vagasRepository } = getContainer();

      const vaga = await vagasRepository.findById(id);
      if (!vaga) {
        return ApiError.notFound("Vaga");
      }

      const canManage = await canManageVagaForEntidade(usuario, vaga.entidadeId);
      if (!canManage) {
        return ApiError.forbidden("Você não tem permissão para excluir esta vaga.");
      }

      await vagasRepository.softDelete(id);
      return new NextResponse(null, { status: 204 });
    } catch {
      return ApiError.internal("Erro ao excluir vaga");
    }
  });
}
