/**
 * Types related to entity membership (MembroEntidade)
 * These types represent the relationship between users and entities in the backend.
 */

/**
 * Role that a user can have within an entity
 */
export type PapelMembro = "ADMIN" | "MEMBRO";

/**
 * Cargo (position) within an entity - purely expository
 */
export type Cargo = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  entidadeId: string;
};

/**
 * Represents a member of an entity (from backend)
 * This is the source of truth for entity membership and permissions.
 */
export type Membro = {
  id: string;
  usuario: {
    id: string;
    nome: string;
    urlFotoPerfil?: string | null;
    curso?: { nome: string } | null;
    eFacade?: boolean;
  };
  papel: PapelMembro;
  cargo?: Cargo | null;
  startedAt?: string; // ISO date string
  endedAt?: string | null; // ISO date string or null for active members
};

/**
 * Helper function to check if a papel is ADMIN
 */
export function isAdminPapel(papel: PapelMembro): boolean {
  return papel === "ADMIN";
}

/**
 * Helper function to check if a user is admin of an entity
 */
export function isUserAdminOfEntidade(userId: string, membros: Membro[] | undefined): boolean {
  if (!membros) {
    return false;
  }
  return membros.some(m => m.usuario.id === userId && isAdminPapel(m.papel));
}
