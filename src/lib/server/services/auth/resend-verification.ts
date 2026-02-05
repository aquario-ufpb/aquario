import { randomBytes } from "crypto";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("Auth");

export type ResendVerificationByUserInput = {
  usuarioId: string;
};

export type ResendVerificationByEmailInput = {
  email: string;
};

export type ResendVerificationResult = {
  success: boolean;
  message: string;
};

export type ResendVerificationDependencies = {
  usuariosRepository: IUsuariosRepository;
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  emailService: IEmailService;
};

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Resend verification email for authenticated user
 */
export async function resendVerificationByUser(
  input: ResendVerificationByUserInput,
  deps: ResendVerificationDependencies
): Promise<ResendVerificationResult> {
  const usuario = await deps.usuariosRepository.findById(input.usuarioId);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  if (!usuario.email) {
    throw new Error("Usuário não possui email cadastrado.");
  }

  if (usuario.eVerificado) {
    return {
      success: true,
      message: "Seu email já está verificado.",
    };
  }

  // Rate limiting
  const lastToken = await deps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
    input.usuarioId,
    "VERIFICACAO_EMAIL"
  );

  if (lastToken && lastToken.criadoEm) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (lastToken.criadoEm > oneMinuteAgo) {
      throw new Error("Aguarde pelo menos 1 minuto antes de solicitar outro email.");
    }
  }

  // Delete old tokens
  await deps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(
    input.usuarioId,
    "VERIFICACAO_EMAIL"
  );

  // Generate new token
  const tokenValue = generateToken();
  const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await deps.tokenVerificacaoRepository.create({
    usuarioId: usuario.id,
    token: tokenValue,
    tipo: "VERIFICACAO_EMAIL",
    expiraEm,
  });

  // Send email
  try {
    await deps.emailService.sendVerificationEmail(usuario.email, tokenValue, usuario.nome);
  } catch (error) {
    log.error("Failed to send verification email", error, { email: usuario.email });
    throw new Error("Falha ao enviar email. Tente novamente mais tarde.");
  }

  return {
    success: true,
    message: "Email de verificação enviado. Verifique sua caixa de entrada.",
  };
}

/**
 * Request resend verification by email (unauthenticated)
 * Always returns success to prevent email enumeration
 */
export async function resendVerificationByEmail(
  input: ResendVerificationByEmailInput,
  deps: ResendVerificationDependencies
): Promise<ResendVerificationResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const successResponse: ResendVerificationResult = {
    success: true,
    message:
      "Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.",
  };

  const usuario = await deps.usuariosRepository.findByEmail(normalizedEmail);

  if (!usuario || !usuario.email || usuario.eVerificado) {
    return successResponse;
  }

  // Rate limiting
  const lastToken = await deps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
    usuario.id,
    "VERIFICACAO_EMAIL"
  );

  if (lastToken && lastToken.criadoEm) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (lastToken.criadoEm > oneMinuteAgo) {
      return successResponse;
    }
  }

  // Delete old tokens
  await deps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(usuario.id, "VERIFICACAO_EMAIL");

  // Generate new token
  const tokenValue = generateToken();
  const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await deps.tokenVerificacaoRepository.create({
    usuarioId: usuario.id,
    token: tokenValue,
    tipo: "VERIFICACAO_EMAIL",
    expiraEm,
  });

  // Send email
  try {
    await deps.emailService.sendVerificationEmail(usuario.email, tokenValue, usuario.nome);
  } catch (error) {
    log.error("Failed to send verification email", error, { email: usuario.email });
  }

  return successResponse;
}
