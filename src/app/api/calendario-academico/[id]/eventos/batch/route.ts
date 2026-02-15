import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

type RouteContext = { params: Promise<{ id: string }> };

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

const batchCreateSchema = z.object({
  eventos: z.array(
    z.object({
      descricao: z.string().min(1),
      dataInicio: z.string().min(1),
      dataFim: z.string().min(1),
      categoria: z.enum(categoriaValues).default("OUTRA"),
    })
  ),
  replace: z.boolean().default(false),
});

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

      if (data.replace) {
        await calendarioRepository.deleteEventosBySemestreId(semestreId);
      }

      const count = await calendarioRepository.createEventosBatch(
        data.eventos.map(e => ({
          descricao: e.descricao,
          dataInicio: new Date(e.dataInicio),
          dataFim: new Date(e.dataFim),
          categoria: e.categoria,
          semestreId,
        }))
      );

      return NextResponse.json({ count }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      return ApiError.internal("Erro ao importar eventos");
    }
  });
}
