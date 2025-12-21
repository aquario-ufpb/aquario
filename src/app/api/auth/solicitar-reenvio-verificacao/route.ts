import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { resendVerificationByEmail } from "@/lib/server/services/auth/resend-verification";

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
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    // Always return success for security
    return NextResponse.json({
      success: true,
      message:
        "Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.",
    });
  }
}
