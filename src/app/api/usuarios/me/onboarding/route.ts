import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { onboardingPatchSchema } from "@/lib/server/api-schemas/usuarios";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { usuariosRepository } = getContainer();
      const metadata = await usuariosRepository.getOnboardingMetadata(usuario.id);
      return NextResponse.json(metadata ?? {});
    } catch (error) {
      return handleError(error, "Erro ao buscar onboarding metadata");
    }
  });
}

export function PATCH(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const parsed = onboardingPatchSchema.parse(body);
      const { usuariosRepository } = getContainer();
      await usuariosRepository.updateOnboardingMetadata(usuario.id, parsed);
      const updated = await usuariosRepository.getOnboardingMetadata(usuario.id);
      return NextResponse.json(updated ?? {});
    } catch (error) {
      return handleError(error, "Erro ao atualizar onboarding metadata");
    }
  });
}
