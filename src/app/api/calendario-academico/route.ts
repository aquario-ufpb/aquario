import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { calendarioRepository } = getContainer();
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get("ativo");

    if (ativo === "true") {
      const semestre = await calendarioRepository.findSemestreAtivo();
      return NextResponse.json(semestre);
    }

    const semestres = await calendarioRepository.findAllSemestres();
    return NextResponse.json(semestres);
  } catch {
    return ApiError.internal("Erro ao buscar semestres");
  }
}

const dateString = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(s => !isNaN(new Date(s).getTime()), { message: "Data inválida" });

const createSemestreSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dataInicio: dateString,
  dataFim: dateString,
});

export function POST(request: Request) {
  return withAdmin(request, async req => {
    try {
      const body = await req.json();
      const data = createSemestreSchema.parse(body);

      const { calendarioRepository } = getContainer();

      const semestre = await calendarioRepository.createSemestre({
        nome: data.nome,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
      });

      return NextResponse.json(semestre, { status: 201 });
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
      return ApiError.internal("Erro ao criar semestre");
    }
  });
}
