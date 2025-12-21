import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { verifyEmail } from "@/lib/server/services/auth/verify-email";

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
      return NextResponse.json(
        { success: false, message: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro na verificação";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
