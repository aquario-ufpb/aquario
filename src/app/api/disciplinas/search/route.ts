import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/disciplinas/search?q=term
 * Searches disciplines by code or name. Public endpoint (no auth required).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ disciplinas: [] });
    }

    const container = getContainer();
    const disciplinas = await container.disciplinaRepository.search(query);

    return NextResponse.json({ disciplinas });
  } catch {
    return ApiError.internal("Erro ao buscar disciplinas");
  }
}
