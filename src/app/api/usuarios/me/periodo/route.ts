import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  periodoAtual: z.string().min(1).nullable(),
});

export function PATCH(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const parsed = patchSchema.parse(body);
      const { usuariosRepository } = getContainer();
      await usuariosRepository.updatePeriodoAtual(usuario.id, parsed.periodoAtual);
      return NextResponse.json({ periodoAtual: parsed.periodoAtual });
    } catch (error) {
      return handleError(error, "Erro ao atualizar período atual");
    }
  });
}
