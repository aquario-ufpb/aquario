import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { createEventoSchema } from "@/lib/server/api-schemas/calendario";

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
