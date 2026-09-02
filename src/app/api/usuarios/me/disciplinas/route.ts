import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { updateCompletedDisciplinasSchema } from "@/lib/server/api-schemas/usuarios";

export const dynamic = "force-dynamic";

/**
 * GET /api/usuarios/me/disciplinas
 * Returns completed disciplines with stable identity independent of the current curriculum.
 */
export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const container = getContainer();
      const disciplinas = await container.disciplinaConcluidaRepository.findByUsuario(usuario.id);
      const disciplinaIds = disciplinas.map(item => item.disciplinaId);

      return NextResponse.json({ disciplinaIds, disciplinas });
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
      const parsed = updateCompletedDisciplinasSchema.safeParse(body);

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
