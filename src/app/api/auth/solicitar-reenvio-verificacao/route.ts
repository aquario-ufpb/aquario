import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { resendVerificationByEmail } from "@/lib/server/services/auth/resend-verification";
import { fromZodError } from "@/lib/server/errors";

const requestSchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const container = getContainer();
    const result = await resendVerificationByEmail(
      { email },
      {
        usuariosRepository: container.usuariosRepository,
        tokenVerificacaoRepository: container.tokenVerificacaoRepository,
        emailService: container.emailService,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromZodError(error);
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      message:
        "Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.",
    });
  }
}
