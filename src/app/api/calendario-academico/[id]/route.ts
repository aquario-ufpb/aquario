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

    return NextResponse.json(semestre);
  } catch {
    return ApiError.internal("Erro ao buscar semestre");
  }
}

const dateString = z
  .string()
  .refine(s => !isNaN(new Date(s).getTime()), { message: "Data inválida" });

const updateSemestreSchema = z.object({
  nome: z.string().min(1).optional(),
  dataInicio: dateString.optional(),
  dataFim: dateString.optional(),
});

export function PUT(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const data = updateSemestreSchema.parse(body);

      const { calendarioRepository } = getContainer();

      const updateData: { nome?: string; dataInicio?: Date; dataFim?: Date } = {};
      if (data.nome !== undefined) {
        updateData.nome = data.nome;
      }
      if (data.dataInicio !== undefined) {
        updateData.dataInicio = new Date(data.dataInicio);
      }
      if (data.dataFim !== undefined) {
        updateData.dataFim = new Date(data.dataFim);
      }

      const semestre = await calendarioRepository.updateSemestre(id, updateData);

      if (!semestre) {
        return ApiError.notFound("Semestre", "SEMESTRE_NOT_FOUND" as never);
      }

      return NextResponse.json(semestre);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return ApiError.conflict(
          "Já existe um semestre com este nome",
          "SEMESTRE_NOME_EXISTS" as never
        );
      }
      return ApiError.internal("Erro ao atualizar semestre");
    }
  });
}

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async () => {
    try {
      const { id } = await context.params;
      const { calendarioRepository } = getContainer();
      const deleted = await calendarioRepository.deleteSemestre(id);

      if (!deleted) {
        return ApiError.notFound("Semestre", "SEMESTRE_NOT_FOUND" as never);
      }

      return NextResponse.json({ message: "Semestre removido com sucesso" });
    } catch {
      return ApiError.internal("Erro ao remover semestre");
    }
  });
}
