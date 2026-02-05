import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { membrosRepository } = getContainer();

    // Get all memberships for the specified user
    const memberships = await membrosRepository.findByUsuarioId(id);

    // Format the response (same format as /usuarios/me/membros)
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
}
