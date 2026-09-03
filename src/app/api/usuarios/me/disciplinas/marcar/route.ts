import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { marcarDisciplinasSchema } from "@/lib/server/api-schemas/usuarios";

export const dynamic = "force-dynamic";

/**
 * POST /api/usuarios/me/disciplinas/marcar
 * Marks disciplines as concluida, cursando, or removes the status.
 * Handles mutual exclusivity atomically: marking as cursando removes concluida and vice versa.
 */
export function POST(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return ApiError.badRequest("Corpo da requisição inválido");
      }
      const parsed = marcarDisciplinasSchema.safeParse(body);
      if (!parsed.success) {
        return ApiError.badRequest("disciplinaIds deve ser um array de UUIDs e status válido");
      }

      const { disciplinaIds, status, expectedCursoId, expectedCurriculoId } = parsed.data;

      if (Boolean(expectedCursoId) !== Boolean(expectedCurriculoId)) {
        return ApiError.badRequest("Curso e currículo esperados devem ser informados juntos");
      }

      const container = getContainer();
      const ativo = await container.calendarioRepository.findSemestreAtivo();

      await container.disciplinaSemestreRepository.marcarDisciplinas(
        usuario.id,
        disciplinaIds,
        status,
        ativo?.id ?? null,
        expectedCursoId,
        expectedCurriculoId
      );

      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "NO_ACTIVE_SEMESTER") {
        return ApiError.badRequest("Não há semestre letivo ativo configurado");
      }
      if (
        error instanceof Error &&
        error.message === "COURSE_CHANGED_DURING_DISCIPLINE_CONFIRMATION"
      ) {
        return ApiError.badRequest(
          "Seu curso mudou durante esta confirmação. Recarregue a grade e confira novamente"
        );
      }
      if (error instanceof Error && error.message === "DISCIPLINE_OUTSIDE_ACTIVE_CURRICULUM") {
        return ApiError.badRequest(
          "Uma ou mais disciplinas não pertencem à grade ativa do seu curso"
        );
      }
      return ApiError.internal("Erro ao marcar disciplinas");
    }
  });
}
