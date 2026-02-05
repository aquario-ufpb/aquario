import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { resendVerificationByUser } from "@/lib/server/services/auth/resend-verification";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";

export function POST(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const container = getContainer();
      const result = await resendVerificationByUser(
        { usuarioId: usuario.id },
        {
          usuariosRepository: container.usuariosRepository,
          tokenVerificacaoRepository: container.tokenVerificacaoRepository,
          emailService: container.emailService,
        }
      );

      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao reenviar verificação";
      return ApiError.badRequest(message);
    }
  });
}
