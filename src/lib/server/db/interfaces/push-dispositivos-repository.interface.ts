import type { PushCategoria, PushPreferencias, RegistrarDispositivo } from "@/lib/shared/push/push";

export type IPushDispositivosRepository = {
  /** Preferências do aparelho, só se ele pertencer ao usuário. */
  find(usuarioId: string, token: string): Promise<PushPreferencias | null>;
  /** Cria ou atualiza o aparelho e o transfere para `usuarioId` (troca de conta no aparelho). */
  upsert(usuarioId: string, dispositivo: RegistrarDispositivo): Promise<void>;
  /** Remove o aparelho do usuário; não remove aparelhos de outras contas. */
  delete(usuarioId: string, token: string): Promise<void>;
  /** Tokens de quem ativou a categoria. */
  tokensFor(categoria: PushCategoria): Promise<string[]>;
  /** Remove tokens que o Expo informou como inválidos. */
  deleteTokens(tokens: string[]): Promise<void>;
};
