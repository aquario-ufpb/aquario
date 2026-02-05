import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { membrosRepository } = getContainer();

      // Get all memberships for the current user
      const memberships = await membrosRepository.findByUsuarioId(usuario.id);

      // Format the response
      const formattedMemberships = memberships.map(m => ({
        id: m.id,
        entidade: m.entidade,
        papel: m.papel,
        cargo: m.cargo,
        startedAt: m.startedAt.toISOString(),
        endedAt: m.endedAt?.toISOString() || null,
      }));

      return NextResponse.json(formattedMemberships);
    } catch {
      return ApiError.internal("Erro ao buscar membros");
    }
  });
}
