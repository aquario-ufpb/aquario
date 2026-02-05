import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { register } from "@/lib/server/services/auth/register";
import { ApiError, fromZodError } from "@/lib/server/errors";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres"),
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
      return fromZodError(error);
    }

    const message = error instanceof Error ? error.message : "Erro no cadastro";

    if (message === "EMAIL_JA_CADASTRADO") {
      return ApiError.emailExists();
    }

    return ApiError.badRequest(message);
  }
}
