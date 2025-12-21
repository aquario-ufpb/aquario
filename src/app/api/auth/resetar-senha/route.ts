import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { resetPassword } from "@/lib/server/services/auth/reset-password";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  novaSenha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

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
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro ao redefinir senha";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
