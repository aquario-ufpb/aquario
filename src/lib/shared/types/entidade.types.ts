/**
 * Entity type definitions
 */

import type { Membro } from "./membro.types";

export type TipoEntidade =
  | "LABORATORIO"
  | "CENTRO_ACADEMICO"
  | "ATLETICA"
  | "LIGA_ESTUDANTIL"
  | "GRUPO_ESTUDANTIL"
  | "OUTRO"
  | "EMPRESA";

/**
 * Person type used by the local file provider (static JSON files)
 * This is a simplified display format for people associated with an entity.
 * Note: When using the backend provider, this is derived from Membro[].
 */
export type Person = {
  name: string;
  email: string;
  role: string;
  profession: string;
};

/**
 * Entity type
 *
 * Note on data sources:
 * - `people`: Only used by local file provider (from JSON files).
 *             For backend provider, derive from `membros` using `getPeopleFromEntidade()`.
 * - `membros`: Only available when using backend provider.
 *              Contains full membership information including user IDs and roles.
 *              Used for permission checks (e.g., checking if user is ADMIN).
 * - `centro`: Only available from backend provider.
 *             Contains centro information (nome, sigla).
 */
export type Entidade = {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  tipo: TipoEntidade;
  imagePath: string;
  contato_email: string;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  founding_date?: string | null;
  people?: Person[]; // Only from local provider - use getPeopleFromEntidade() helper
  order?: number | null;
  membros?: Membro[]; // Backend only - full membership data for permissions
  centro?: {
    id: string;
    nome: string;
    sigla: string;
  } | null; // Backend only - centro information
};

/**
 * Helper function to get people array from an entidade
 * Handles both local provider (direct people array) and backend provider (derived from membros)
 */
export function getPeopleFromEntidade(entidade: Entidade): Person[] {
  // If people array exists (local provider), use it
  if (entidade.people) {
    return entidade.people;
  }

  // Otherwise, derive from membros (backend provider)
  if (entidade.membros) {
    return entidade.membros.map(membro => ({
      name: membro.usuario.nome,
      email: "", // Backend doesn't expose email
      role: membro.papel,
      profession: membro.usuario.curso?.nome || "",
    }));
  }

  // Fallback to empty array
  return [];
}
