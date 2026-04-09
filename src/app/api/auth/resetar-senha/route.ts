import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { resetPassword } from "@/lib/server/services/auth/reset-password";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { resetPasswordSchema } from "@/lib/server/api-schemas/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, novaSenha } = resetPasswordSchema.parse(body);

    const container = getContainer();
    const result = await resetPassword(
      { token, novaSenha },
      {
        tokenVerificacaoRepository: container.tokenVerificacaoRepository,
        usuariosRepository: container.usuariosRepository,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromZodError(error);
    }

    const message = error instanceof Error ? error.message : "Erro ao redefinir senha";
    return ApiError.badRequest(message);
  }
}
