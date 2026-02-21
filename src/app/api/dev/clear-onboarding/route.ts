import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { IS_DEV } from "@/lib/shared/config/env";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withAuth(request, async (_req, usuario) => {
    try {
      const { usuariosRepository } = getContainer();
      await usuariosRepository.clearOnboardingMetadata(usuario.id);
      return NextResponse.json({});
    } catch (error) {
      return handleError(error, "Erro ao limpar onboarding metadata");
    }
  });
}
