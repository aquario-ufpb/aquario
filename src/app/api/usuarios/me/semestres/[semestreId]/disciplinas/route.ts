import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { prisma } from "@/lib/server/db/prisma";
import { z } from "zod";

type RouteContext = { params: Promise<{ semestreId: string }> };

const saveSchema = z.object({
  disciplinas: z.array(
    z.object({
      codigoDisciplina: z.string().min(1),
      turma: z.string().nullish(),
      docente: z.string().nullish(),
      horario: z.string().nullish(),
      codigoPaas: z.number().int().nullish(),
    })
  ),
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
 * GET /api/usuarios/me/semestres/[semestreId]/disciplinas
 * Returns the user's enrolled disciplines for a specific semester.
 * semestreId can be a UUID or "ativo" to auto-resolve the active semester.
 */
export function GET(request: Request, context: RouteContext) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { semestreId } = await context.params;
      const resolvedId = await resolveSemestreId(semestreId);

      if (!resolvedId) {
        return NextResponse.json({ semestreLetivoId: null, disciplinas: [] });
      }

      const records = await prisma.disciplinaSemestre.findMany({
        where: { usuarioId: usuario.id, semestreLetivoId: resolvedId },
        include: { disciplina: { select: { codigo: true, nome: true } } },
        orderBy: { criadoEm: "asc" },
      });

      return NextResponse.json({
        semestreLetivoId: resolvedId,
        disciplinas: records.map(r => ({
          id: r.id,
          disciplinaId: r.disciplinaId,
          disciplinaCodigo: r.disciplina.codigo,
          disciplinaNome: r.disciplina.nome,
          turma: r.turma,
          docente: r.docente,
          horario: r.horario,
          codigoPaas: r.codigoPaas,
          criadoEm: r.criadoEm.toISOString(),
        })),
      });
    } catch {
      return ApiError.internal("Erro ao buscar disciplinas do semestre");
    }
  });
}

/**
 * PUT /api/usuarios/me/semestres/[semestreId]/disciplinas
 * Replaces all enrolled disciplines for a specific semester.
 * Accepts codigoDisciplina (PAAS codigo) and resolves to disciplinaId server-side.
 */
export function PUT(request: Request, context: RouteContext) {
  return withAuth(request, async (req, usuario) => {
    try {
      const { semestreId } = await context.params;
      const resolvedId = await resolveSemestreId(semestreId);

      if (!resolvedId) {
        return ApiError.notFound("Semestre ativo");
      }

      const body = await req.json();
      const parsed = saveSchema.safeParse(body);
      if (!parsed.success) {
        return ApiError.badRequest("Dados de disciplinas inválidos");
      }

      // Resolve codigoDisciplina to disciplinaId in bulk
      const codigos = parsed.data.disciplinas.map(d => d.codigoDisciplina);
      const disciplinas = await prisma.disciplina.findMany({
        where: { codigo: { in: codigos } },
        select: { id: true, codigo: true },
      });
      const codigoToId = new Map(disciplinas.map(d => [d.codigo, d.id]));

      // Only save disciplines that have a matching DB record
      const validRecords = parsed.data.disciplinas
        .map(d => {
          const disciplinaId = codigoToId.get(d.codigoDisciplina);
          if (!disciplinaId) {
            return null;
          }
          return {
            disciplinaId,
            turma: d.turma ?? null,
            docente: d.docente ?? null,
            horario: d.horario ?? null,
            codigoPaas: d.codigoPaas ?? null,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const container = getContainer();
      const records = await container.disciplinaSemestreRepository.replaceForUsuarioAndSemestre(
        usuario.id,
        resolvedId,
        validRecords
      );

      return NextResponse.json({
        semestreLetivoId: resolvedId,
        disciplinas: records.map(r => ({
          id: r.id,
          disciplinaId: r.disciplinaId,
          turma: r.turma,
          docente: r.docente,
          horario: r.horario,
          codigoPaas: r.codigoPaas,
          criadoEm: r.criadoEm.toISOString(),
        })),
      });
    } catch {
      return ApiError.internal("Erro ao salvar disciplinas do semestre");
    }
  });
}
