import { z } from "zod";

/**
 * Zod request schemas for the /api/auth/* endpoints.
 *
 * These are defined outside of the route.ts files because Next.js 15 only
 * allows HTTP handler names (GET, POST, ...) and a small set of config
 * constants to be exported from a route module. Any other export breaks
 * the build with: "X is not a valid Route export field".
 *
 * Keeping them in a dedicated module also makes it trivial to reuse the
 * exact same validation rules client-side or in tests, without having to
 * import the full route handler tree.
 */

/** Schema de validação para login (email + senha). */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

/** Schema de validação para cadastro de novo usuário. */
export const registerSchema = z.object({
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

/** Schema de validação para verificação de email via token. */
export const verifySchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
});

/** Schema de validação para solicitação de recuperação de senha. */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

/** Schema de validação para redefinição de senha (token + nova senha). */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  novaSenha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

/** Schema de validação para reenvio do email de verificação. */
export const resendVerificationRequestSchema = z.object({
  email: z.string().email("Email inválido"),
});
