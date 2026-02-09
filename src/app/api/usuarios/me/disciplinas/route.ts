import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { prisma } from "@/lib/server/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  disciplinaIds: z.array(z.string().uuid()),
});

/**
 * GET /api/usuarios/me/disciplinas
 * Returns the list of disciplinaIds the authenticated user has completed
 */
export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const concluidas = await prisma.disciplinaConcluida.findMany({
        where: { usuarioId: usuario.id },
        select: { disciplinaId: true },
      });

      const disciplinaIds = concluidas.map(d => d.disciplinaId);
      return NextResponse.json({ disciplinaIds });
    } catch {
      return ApiError.internal("Erro ao buscar disciplinas concluídas");
    }
  });
}

/**
 * PUT /api/usuarios/me/disciplinas
 * Syncs the full set of completed disciplines for the authenticated user.
 * Receives { disciplinaIds: string[] } and replaces all existing records.
 */
export function PUT(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const parsed = updateSchema.safeParse(body);

      if (!parsed.success) {
        return ApiError.badRequest("disciplinaIds deve ser um array de UUIDs válidos");
      }

      const { disciplinaIds } = parsed.data;

      // Use a transaction to atomically replace all records
      await prisma.$transaction(async (tx) => {
        // Remove all existing
        await tx.disciplinaConcluida.deleteMany({
          where: { usuarioId: usuario.id },
        });

        // Insert new ones (if any)
        if (disciplinaIds.length > 0) {
          await tx.disciplinaConcluida.createMany({
            data: disciplinaIds.map(disciplinaId => ({
              usuarioId: usuario.id,
              disciplinaId,
            })),
            skipDuplicates: true,
          });
        }
      });

      return NextResponse.json({ disciplinaIds });
    } catch {
      return ApiError.internal("Erro ao atualizar disciplinas concluídas");
    }
  });
}
