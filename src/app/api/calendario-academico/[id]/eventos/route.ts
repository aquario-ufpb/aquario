import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { calendarioRepository } = getContainer();

    const semestre = await calendarioRepository.findSemestreById(id);
    if (!semestre) {
      return ApiError.notFound("Semestre", "SEMESTRE_NOT_FOUND" as never);
    }

    const eventos = await calendarioRepository.findEventosBySemestreId(id);
    return NextResponse.json(eventos);
  } catch {
    return ApiError.internal("Erro ao buscar eventos");
  }
}

const categoriaValues = [
  "MATRICULA_INGRESSANTES",
  "MATRICULA_VETERANOS",
  "REMATRICULA",
  "MATRICULA_EXTRAORDINARIA",
  "PONTO_FACULTATIVO",
  "FERIADO",
  "EXAMES_FINAIS",
  "REGISTRO_MEDIAS_FINAIS",
  "COLACAO_DE_GRAU",
  "INICIO_PERIODO_LETIVO",
  "TERMINO_PERIODO_LETIVO",
  "OUTRA",
] as const;

const createEventoSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  categoria: z.enum(categoriaValues).default("OUTRA"),
});

export function POST(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    try {
      const { id: semestreId } = await context.params;
      const body = await req.json();
      const data = createEventoSchema.parse(body);

      const { calendarioRepository } = getContainer();

      const semestre = await calendarioRepository.findSemestreById(semestreId);
      if (!semestre) {
        return ApiError.notFound("Semestre", "SEMESTRE_NOT_FOUND" as never);
      }

      const evento = await calendarioRepository.createEvento({
        descricao: data.descricao,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        categoria: data.categoria,
        semestreId,
      });

      return NextResponse.json(evento, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      return ApiError.internal("Erro ao criar evento");
    }
  });
}
