import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { withAuth, canManageVagaForEntidade } from "@/lib/server/services/auth/middleware";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { mapVagaToJson } from "@/lib/server/utils/vaga-mapper";

const TIPO_VAGA_VALUES = [
  "ESTAGIO",
  "TRAINEE",
  "VOLUNTARIO",
  "PESQUISA",
  "CLT",
  "PJ",
  "OUTRO",
] as const;

const createVagaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipoVaga: z.enum(TIPO_VAGA_VALUES),
  entidadeId: z.string().uuid("ID de entidade inválido"),
  linkInscricao: z.string().min(1, "Link para inscrição é obrigatório"),
  dataFinalizacao: z.string().refine(v => !isNaN(Date.parse(v)), {
    message: "Data de finalização inválida",
  }),
  areas: z.array(z.string()).optional().default([]),
  salario: z.string().nullable().optional(),
  sobreEmpresa: z.string().nullable().optional(),
  responsabilidades: z.array(z.string()).optional().default([]),
  requisitos: z.array(z.string()).optional().default([]),
  informacoesAdicionais: z.string().nullable().optional(),
  etapasProcesso: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const { vagasRepository } = getContainer();
    const vagas = await vagasRepository.findManyActive();
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
      const message = error instanceof Error ? error.message : "Erro ao criar vaga";
      return ApiError.badRequest(message);
    }
  });
}
