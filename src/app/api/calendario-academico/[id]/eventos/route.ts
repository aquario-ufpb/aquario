import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { ALL_CATEGORIAS } from "@/lib/shared/config/calendario-academico";

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

const dateString = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(s => !isNaN(new Date(s).getTime()), { message: "Data inválida" });

const createEventoSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  dataInicio: dateString,
  dataFim: dateString,
  categoria: z.enum(ALL_CATEGORIAS).default("OUTRA"),
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
