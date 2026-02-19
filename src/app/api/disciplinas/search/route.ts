import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/server/db/prisma";
import { ApiError } from "@/lib/server/errors";

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

    const disciplinas = await prisma.disciplina.findMany({
      where: {
        OR: [{ codigo: { contains: query } }, { nome: { contains: query, mode: "insensitive" } }],
      },
      select: { id: true, codigo: true, nome: true },
      take: 20,
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ disciplinas });
  } catch {
    return ApiError.internal("Erro ao buscar disciplinas");
  }
}
