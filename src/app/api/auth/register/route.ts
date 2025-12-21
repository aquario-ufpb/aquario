import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { register } from "@/lib/server/services/auth/register";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  centroId: z.string().uuid("Centro inválido"),
  cursoId: z.string().uuid("Curso inválido"),
  urlFotoPerfil: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const container = getContainer();
    const result = await register(data, {
      usuariosRepository: container.usuariosRepository,
      centrosRepository: container.centrosRepository,
      cursosRepository: container.cursosRepository,
      tokenVerificacaoRepository: container.tokenVerificacaoRepository,
      emailService: container.emailService,
    });

    return NextResponse.json({
      message: result.autoVerificado
        ? "Cadastro realizado com sucesso!"
        : "Cadastro realizado! Verifique seu email para ativar sua conta.",
      usuarioId: result.usuarioId,
      verificado: result.autoVerificado,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro no cadastro";
    return NextResponse.json({ message }, { status: 400 });
  }
}
