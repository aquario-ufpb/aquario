import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import { getContainer } from "@/lib/server/container";
import { z } from "zod";

export const dynamic = "force-dynamic";

const marcarSchema = z.object({
  disciplinaIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["concluida", "cursando", "none"]),
});

/**
 * POST /api/usuarios/me/disciplinas/marcar
 * Marks disciplines as concluida, cursando, or removes the status.
 * Handles mutual exclusivity atomically: marking as cursando removes concluida and vice versa.
 */
export function POST(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return ApiError.badRequest("Corpo da requisição inválido");
      }
      const parsed = marcarSchema.safeParse(body);
      if (!parsed.success) {
        return ApiError.badRequest("disciplinaIds deve ser um array de UUIDs e status válido");
      }

      const { disciplinaIds, status } = parsed.data;

      const container = getContainer();
      const ativo = await container.calendarioRepository.findSemestreAtivo();

      await container.disciplinaSemestreRepository.marcarDisciplinas(
        usuario.id,
        disciplinaIds,
        status,
        ativo?.id ?? null
      );

      return NextResponse.json({ ok: true });
    } catch (error) {
      if (error instanceof Error && error.message === "NO_ACTIVE_SEMESTER") {
        return ApiError.badRequest("Não há semestre letivo ativo configurado");
      }
      return ApiError.internal("Erro ao marcar disciplinas");
    }
  });
}
