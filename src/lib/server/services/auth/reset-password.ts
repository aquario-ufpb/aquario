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

  const senhaHash = await hash(input.novaSenha, 10);
  const consumed = await deps.usuariosRepository.resetPasswordWithToken(
    tokenData.usuarioId,
    tokenData.id,
    senhaHash
  );
  if (!consumed) {
    throw new Error("Token inválido ou expirado.");
  }

  return {
    success: true,
    message: "Senha redefinida com sucesso! Você já pode fazer login.",
  };
}
