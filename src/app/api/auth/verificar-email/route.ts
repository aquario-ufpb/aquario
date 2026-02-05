import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { verifyEmail } from "@/lib/server/services/auth/verify-email";
import { ApiError, fromZodError } from "@/lib/server/errors";

const verifySchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = verifySchema.parse(body);

    const container = getContainer();
    const result = await verifyEmail(
      { token },
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

    const message = error instanceof Error ? error.message : "Erro na verificação";
    return ApiError.badRequest(message);
  }
}
