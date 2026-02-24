import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { withAuth, canManageVagaForEntidade } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import type { VagaWithRelations } from "@/lib/server/db/interfaces/vagas-repository.interface";

type RouteContext = { params: Promise<{ id: string }> };

function mapVagaToJson(vaga: VagaWithRelations) {
  return {
    id: vaga.id,
    titulo: vaga.titulo,
    descricao: vaga.descricao,
    tipoVaga: vaga.tipoVaga,
    areas: vaga.areas,
    criadoEm: vaga.criadoEm.toISOString(),
    dataFinalizacao: vaga.dataFinalizacao.toISOString(),
    linkInscricao: vaga.linkInscricao,
    salario: vaga.salario ?? undefined,
    sobreEmpresa: vaga.sobreEmpresa ?? undefined,
    responsabilidades: vaga.responsabilidades,
    requisitos: vaga.requisitos,
    informacoesAdicionais: vaga.informacoesAdicionais ?? undefined,
    etapasProcesso: vaga.etapasProcesso,
    entidade: {
      id: vaga.entidade.id,
      nome: vaga.entidade.nome,
      slug: vaga.entidade.slug ?? undefined,
      tipo: vaga.entidade.tipo,
    },
    publicador: {
      nome: vaga.criadoPor.nome,
      urlFotoPerfil: vaga.criadoPor.urlFotoPerfil ?? undefined,
    },
  };
}

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
  return withAuth(request, async (_req, usuario) => {
    try {
      const { id } = await context.params;
      const { vagasRepository } = getContainer();

      const vaga = await vagasRepository.findById(id);
      if (!vaga) {
        return ApiError.notFound("Vaga");
      }

      const canManage = await canManageVagaForEntidade(usuario, vaga.entidadeId);
      if (!canManage) {
        return ApiError.forbidden(
          "Você não tem permissão para excluir esta vaga."
        );
      }

      await vagasRepository.softDelete(id);
      return new NextResponse(null, { status: 204 });
    } catch {
      return ApiError.internal("Erro ao excluir vaga");
    }
  });
}
