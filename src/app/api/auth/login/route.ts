import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { authenticate } from "@/lib/server/services/auth/authenticate";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = loginSchema.parse(body);

    const { usuariosRepository } = getContainer();
    const result = await authenticate({ email, senha }, usuariosRepository);

    return NextResponse.json({ token: result.token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro no login";

    if (message === "EMAIL_NAO_ENCONTRADO") {
      return NextResponse.json({ message: "Email não encontrado" }, { status: 401 });
    }

    if (message === "SENHA_INVALIDA") {
      return NextResponse.json({ message: "Senha incorreta" }, { status: 401 });
    }

    return NextResponse.json({ message }, { status: 401 });
  }
}
