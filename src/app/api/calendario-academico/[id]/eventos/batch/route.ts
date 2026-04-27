import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { batchCreateSchema } from "@/lib/server/api-schemas/calendario";

type RouteContext = { params: Promise<{ id: string }> };

export function POST(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    try {
      const { id: semestreId } = await context.params;
      const body = await req.json();
      const data = batchCreateSchema.parse(body);

      const { calendarioRepository } = getContainer();

      const semestre = await calendarioRepository.findSemestreById(semestreId);
      if (!semestre) {
        return ApiError.notFound("Semestre", "SEMESTRE_NOT_FOUND" as never);
      }

      const eventosData = data.eventos.map(e => ({
        descricao: e.descricao,
        dataInicio: new Date(e.dataInicio),
        dataFim: new Date(e.dataFim),
        categoria: e.categoria,
        semestreId,
      }));

      const count = data.replace
        ? await calendarioRepository.replaceEventosBatch(semestreId, eventosData)
        : await calendarioRepository.createEventosBatch(eventosData);

      return NextResponse.json({ count }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      return ApiError.internal("Erro ao importar eventos");
    }
  });
}
