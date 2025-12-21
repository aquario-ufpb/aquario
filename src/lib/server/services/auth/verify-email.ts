import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";

export type VerifyEmailInput = {
  token: string;
};

export type VerifyEmailResult = {
  success: boolean;
  message: string;
};

export type VerifyEmailDependencies = {
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  usuariosRepository: IUsuariosRepository;
};

/**
 * Verify a user's email using the verification token
 */
export async function verifyEmail(
  input: VerifyEmailInput,
  deps: VerifyEmailDependencies
): Promise<VerifyEmailResult> {
  const tokenData = await deps.tokenVerificacaoRepository.findByToken(input.token);

  if (!tokenData) {
    throw new Error("Token inválido ou expirado.");
  }

  // Check if token is expired
  if (tokenData.expiraEm < new Date()) {
    throw new Error("Token expirado. Solicite um novo email de verificação.");
  }

  // Check if token was already used
  if (tokenData.usadoEm) {
    throw new Error("Este link já foi utilizado.");
  }

  // Check token type
  if (tokenData.tipo !== "VERIFICACAO_EMAIL") {
    throw new Error("Token inválido.");
  }

  // Find the user
  const usuario = await deps.usuariosRepository.findById(tokenData.usuarioId);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  // Check if already verified
  if (usuario.eVerificado) {
    return {
      success: true,
      message: "Email já verificado anteriormente.",
    };
  }

  // Mark user as verified
  await deps.usuariosRepository.markAsVerified(usuario.id);

  // Mark token as used
  await deps.tokenVerificacaoRepository.markAsUsed(tokenData.id);

  return {
    success: true,
    message: "Email verificado com sucesso! Você já pode fazer login.",
  };
}

