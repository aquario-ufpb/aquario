import { compare } from "bcryptjs";
import { signToken } from "@/lib/server/services/jwt/jwt";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

export type AuthenticateInput = {
  email: string;
  senha: string;
};

export type AuthenticateResult = {
  token: string;
  usuario: UsuarioWithRelations;
};

/**
 * Authenticate a user by email and password
 */
export async function authenticate(
  input: AuthenticateInput,
  usuariosRepository: IUsuariosRepository
): Promise<AuthenticateResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  const usuario = await usuariosRepository.findByEmail(normalizedEmail);

  if (!usuario) {
    throw new Error("EMAIL_NAO_ENCONTRADO");
  }

  const senhaCorresponde = await compare(input.senha, usuario.senhaHash);

  if (!senhaCorresponde) {
    throw new Error("SENHA_INVALIDA");
  }

  if (!usuario.eVerificado) {
    throw new Error(
      "Email não verificado. Verifique sua caixa de entrada ou solicite um novo email de verificação."
    );
  }

  const token = signToken(usuario.id);

  return { token, usuario };
}

