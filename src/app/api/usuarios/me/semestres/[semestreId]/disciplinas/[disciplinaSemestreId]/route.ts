import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { z } from "zod";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ semestreId: string; disciplinaSemestreId: string }>;
};

const patchSchema = z.object({
  turma: z.string().nullish(),
  docente: z.string().nullish(),
  horario: z.string().nullish(),
  codigoPaas: z.number().int().nullish(),
});

async function resolveSemestreId(semestreId: string): Promise<string | null> {
  if (semestreId === "ativo") {
    const container = getContainer();
    const ativo = await container.calendarioRepository.findSemestreAtivo();
    return ativo?.id ?? null;
  }
  return semestreId;
}

/**
 * PATCH /api/usuarios/me/semestres/[semestreId]/disciplinas/[disciplinaSemestreId]
 * Updates the turma snapshot fields on a single DisciplinaSemestre record.
 */
export function PATCH(request: Request, context: RouteContext) {
  return withAuth(request, async (req, usuario) => {
    try {
      const { semestreId, disciplinaSemestreId } = await context.params;
      const resolvedId = await resolveSemestreId(semestreId);

      if (!resolvedId) {
        return ApiError.notFound("Semestre ativo");
      }

      const container = getContainer();

      // Verify the record exists and belongs to this user
      const record = await container.disciplinaSemestreRepository.findOneOwned(
        disciplinaSemestreId,
        usuario.id,
        resolvedId
      );

      if (!record) {
        return ApiError.notFound("Disciplina do semestre");
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return ApiError.badRequest("Corpo da requisição inválido");
      }
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return ApiError.badRequest("Dados inválidos");
      }

      const updated = await container.disciplinaSemestreRepository.updateFields(
        disciplinaSemestreId,
        parsed.data
      );

      return NextResponse.json({
        id: updated.id,
        disciplinaId: updated.disciplinaId,
        disciplinaCodigo: updated.disciplina.codigo,
        disciplinaNome: updated.disciplina.nome,
        turma: updated.turma,
        docente: updated.docente,
        horario: updated.horario,
        codigoPaas: updated.codigoPaas,
        criadoEm: updated.criadoEm.toISOString(),
      });
    } catch {
      return ApiError.internal("Erro ao atualizar disciplina do semestre");
    }
  });
}
