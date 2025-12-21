import { hash } from "bcryptjs";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";

export type ResetPasswordInput = {
  token: string;
  novaSenha: string;
};

export type ResetPasswordResult = {
  success: boolean;
  message: string;
};

export type ResetPasswordDependencies = {
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  usuariosRepository: IUsuariosRepository;
};

/**
 * Reset a user's password using the reset token
 */
export async function resetPassword(
  input: ResetPasswordInput,
  deps: ResetPasswordDependencies
): Promise<ResetPasswordResult> {
  // Validate password
  if (input.novaSenha.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  if (input.novaSenha.length > 128) {
    throw new Error("A senha deve ter no máximo 128 caracteres.");
  }

  const tokenData = await deps.tokenVerificacaoRepository.findByToken(input.token);

  if (!tokenData) {
    throw new Error("Token inválido ou expirado.");
  }

  // Check if token is expired
  if (tokenData.expiraEm < new Date()) {
    throw new Error("Token expirado. Solicite um novo link de redefinição de senha.");
  }

  // Check if token was already used
  if (tokenData.usadoEm) {
    throw new Error("Este link já foi utilizado.");
  }

  // Check token type
  if (tokenData.tipo !== "RESET_SENHA") {
    throw new Error("Token inválido.");
  }

  // Find the user
  const usuario = await deps.usuariosRepository.findById(tokenData.usuarioId);

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  // Hash the new password
  const senhaHash = await hash(input.novaSenha, 10);

  // Update user's password
  await deps.usuariosRepository.updatePassword(usuario.id, senhaHash);

  // Mark token as used
  await deps.tokenVerificacaoRepository.markAsUsed(tokenData.id);

  return {
    success: true,
    message: "Senha redefinida com sucesso! Você já pode fazer login.",
  };
}
