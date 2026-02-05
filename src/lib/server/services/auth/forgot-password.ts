import { randomBytes } from "crypto";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("Auth");

export type ForgotPasswordInput = {
  email: string;
};

export type ForgotPasswordResult = {
  success: boolean;
  message: string;
};

export type ForgotPasswordDependencies = {
  usuariosRepository: IUsuariosRepository;
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  emailService: IEmailService;
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Request a password reset email
 * Always returns success to prevent email enumeration
 */
export async function forgotPassword(
  input: ForgotPasswordInput,
  deps: ForgotPasswordDependencies
): Promise<ForgotPasswordResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // Always return success to prevent email enumeration attacks
  const successResponse: ForgotPasswordResult = {
    success: true,
    message: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.",
  };

  const usuario = await deps.usuariosRepository.findByEmail(normalizedEmail);

  if (!usuario || !usuario.email) {
    // Don't reveal that user doesn't exist or has no email
    return successResponse;
  }

  // Rate limiting - check if last token was created less than 1 minute ago
  const lastToken = await deps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
    usuario.id,
    "RESET_SENHA"
  );

  if (lastToken && lastToken.criadoEm) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (lastToken.criadoEm > oneMinuteAgo) {
      // Still return success to prevent timing attacks
      return successResponse;
    }
  }

  // Delete old reset tokens for this user
  await deps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(usuario.id, "RESET_SENHA");

  // Generate and save new token (1 hour expiration)
  const tokenValue = generateToken();
  const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

  await deps.tokenVerificacaoRepository.create({
    usuarioId: usuario.id,
    token: tokenValue,
    tipo: "RESET_SENHA",
    expiraEm,
  });

  // Send reset email
  try {
    await deps.emailService.sendPasswordResetEmail(usuario.email, tokenValue, usuario.nome);
  } catch (error) {
    log.error("Failed to send password reset email", error, { email: usuario.email });
    // Still return success to prevent information leakage
  }

  return successResponse;
}
