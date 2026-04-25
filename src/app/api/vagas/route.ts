import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { withAuth, canManageVagaForEntidade } from "@/lib/server/services/auth/middleware";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { mapVagaToJson } from "@/lib/server/utils/vaga-mapper";
import { createVagaSchema, TIPO_VAGA_VALUES } from "@/lib/server/api-schemas/vagas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoVaga = searchParams.get("tipoVaga");
    const entidadeTipos = searchParams.get("entidadeTipos");

    const filter: { tipoVaga?: (typeof TIPO_VAGA_VALUES)[number]; entidadeTipos?: string[] } = {};
    if (tipoVaga && TIPO_VAGA_VALUES.includes(tipoVaga as (typeof TIPO_VAGA_VALUES)[number])) {
      filter.tipoVaga = tipoVaga as (typeof TIPO_VAGA_VALUES)[number];
    }
    if (entidadeTipos) {
      filter.entidadeTipos = entidadeTipos.split(",").filter(Boolean);
    }

    const { vagasRepository } = getContainer();
    const vagas = await vagasRepository.findManyActive(
      new Date(),
      Object.keys(filter).length > 0 ? filter : undefined
    );
    return NextResponse.json(vagas.map(mapVagaToJson));
  } catch {
    return ApiError.internal("Erro ao buscar vagas");
  }
}

export async function POST(request: Request) {
  return await withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const data = createVagaSchema.parse(body);

      const { vagasRepository, entidadesRepository } = getContainer();

      const canManage = await canManageVagaForEntidade(usuario, data.entidadeId);
      if (!canManage) {
        return ApiError.forbidden("Você não tem permissão para criar vagas por esta entidade.");
      }

      const entidade = await entidadesRepository.findById(data.entidadeId);
      if (!entidade) {
        return ApiError.entidadeNotFound();
      }

      const dataFinalizacao = new Date(data.dataFinalizacao);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataFinalizacao < hoje) {
        return ApiError.badRequest("Data de finalização deve ser futura.");
      }

      const vaga = await vagasRepository.create({
        titulo: data.titulo,
        descricao: data.descricao,
        tipoVaga: data.tipoVaga,
        entidadeId: data.entidadeId,
        criadoPorUsuarioId: usuario.id,
        linkInscricao: data.linkInscricao,
        dataFinalizacao,
        areas: data.areas,
        salario: data.salario ?? null,
        sobreEmpresa: data.sobreEmpresa ?? null,
        responsabilidades: data.responsabilidades ?? [],
        requisitos: data.requisitos ?? [],
        informacoesAdicionais: data.informacoesAdicionais ?? null,
        etapasProcesso: data.etapasProcesso ?? [],
      });

      return NextResponse.json(mapVagaToJson(vaga), { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      console.error("Erro ao criar vaga:", error);
      return ApiError.internal("Erro ao criar vaga");
    }
  });
}
