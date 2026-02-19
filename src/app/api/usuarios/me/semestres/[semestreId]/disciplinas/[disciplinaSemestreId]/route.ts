import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { prisma } from "@/lib/server/db/prisma";
import { z } from "zod";

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

      // Verify the record exists and belongs to this user
      const record = await prisma.disciplinaSemestre.findUnique({
        where: { id: disciplinaSemestreId },
      });

      if (!record || record.usuarioId !== usuario.id || record.semestreLetivoId !== resolvedId) {
        return ApiError.notFound("Disciplina do semestre");
      }

      const body = await req.json();
      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return ApiError.badRequest("Dados inválidos");
      }

      const updated = await prisma.disciplinaSemestre.update({
        where: { id: disciplinaSemestreId },
        data: {
          turma: parsed.data.turma ?? null,
          docente: parsed.data.docente ?? null,
          horario: parsed.data.horario ?? null,
          codigoPaas: parsed.data.codigoPaas ?? null,
        },
        include: { disciplina: { select: { codigo: true, nome: true } } },
      });

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
