import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

type RouteContext = { params: Promise<{ id: string; eventoId: string }> };

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

const updateEventoSchema = z.object({
  descricao: z.string().min(1).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  categoria: z.enum(categoriaValues).optional(),
});

export function PUT(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    try {
      const { eventoId } = await context.params;
      const body = await req.json();
      const data = updateEventoSchema.parse(body);

      const { calendarioRepository } = getContainer();

      const updateData: Record<string, unknown> = {};
      if (data.descricao !== undefined) {
        updateData.descricao = data.descricao;
      }
      if (data.dataInicio !== undefined) {
        updateData.dataInicio = new Date(data.dataInicio);
      }
      if (data.dataFim !== undefined) {
        updateData.dataFim = new Date(data.dataFim);
      }
      if (data.categoria !== undefined) {
        updateData.categoria = data.categoria;
      }

      const evento = await calendarioRepository.updateEvento(eventoId, updateData);

      if (!evento) {
        return ApiError.notFound("Evento", "EVENTO_NOT_FOUND" as never);
      }

      return NextResponse.json(evento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      return ApiError.internal("Erro ao atualizar evento");
    }
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async () => {
    try {
      const { eventoId } = await context.params;
      const { calendarioRepository } = getContainer();
      const deleted = await calendarioRepository.deleteEvento(eventoId);

      if (!deleted) {
        return ApiError.notFound("Evento", "EVENTO_NOT_FOUND" as never);
      }

      return NextResponse.json({ message: "Evento removido com sucesso" });
    } catch {
      return ApiError.internal("Erro ao remover evento");
    }
  });
}
