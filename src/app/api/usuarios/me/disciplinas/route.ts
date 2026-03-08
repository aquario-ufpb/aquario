import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
      const container = getContainer();
      const disciplinaIds = await container.disciplinaConcluidaRepository.findByUsuario(usuario.id);

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

      const container = getContainer();
      await container.disciplinaConcluidaRepository.replaceForUsuario(usuario.id, disciplinaIds);

      return NextResponse.json({ disciplinaIds });
    } catch {
      return ApiError.internal("Erro ao atualizar disciplinas concluídas");
    }
  });
}
