import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { IS_DEV } from "@/lib/shared/config/env";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  entidadeId: z.string().uuid(),
});

export function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const { entidadeId } = toggleSchema.parse(body);

      const { entidadesRepository, membrosRepository } = getContainer();

      const entidade = await entidadesRepository.findById(entidadeId);
      if (!entidade) {
        return NextResponse.json({ error: "Entidade não encontrada" }, { status: 404 });
      }

      // Check if user already has an active membership in this entity
      const existing = await membrosRepository.findActiveByUsuarioAndEntidade(
        usuario.id,
        entidadeId
      );

      if (existing) {
        if (existing.papel === "ADMIN") {
          // Already admin → remove membership
          await membrosRepository.delete(existing.id);
          return NextResponse.json({ action: "removed" });
        }
        // Member but not admin → promote
        await membrosRepository.update(existing.id, { papel: "ADMIN" });
        return NextResponse.json({ action: "promoted" });
      }

      // Not a member → add as admin
      await membrosRepository.create({
        usuarioId: usuario.id,
        entidadeId,
        papel: "ADMIN",
        startedAt: new Date(),
        endedAt: null,
      });
      return NextResponse.json({ action: "added" });
    } catch (error) {
      return handleError(error, "Erro ao alterar papel na entidade");
    }
  });
}
