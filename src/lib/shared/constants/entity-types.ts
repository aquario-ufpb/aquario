/**
 * Shared constants for entity types across the application.
 * These are the allowed values for entity categorization in vagas and badges.
 */

export const ENTIDADE_VAGA_TYPES = [
  "laboratorios",
  "grupos",
  "ufpb",
  "pessoa",
  "externo",
  "ligas",
] as const;

export type EntidadeVagaType = (typeof ENTIDADE_VAGA_TYPES)[number];

/**
 * Display labels for entity types (Portuguese)
 */
export const ENTIDADE_VAGA_LABELS: Record<EntidadeVagaType, string> = {
  laboratorios: "Laboratório",
  grupos: "Grupo",
  ufpb: "UFPB",
  pessoa: "Pessoa",
  externo: "Externo",
  ligas: "Liga",
};

/**
 * Short labels for entity types (for badges)
 */
export const ENTIDADE_VAGA_SHORT_LABELS: Record<EntidadeVagaType, string> = {
  laboratorios: "LAB",
  grupos: "GRP",
  ufpb: "UFPB",
  pessoa: "PES",
  externo: "EXT",
  ligas: "LIGA",
};

/**
 * Helper to check if a string is a valid EntidadeVagaType
 */
export function isValidEntidadeVagaType(value: string): value is EntidadeVagaType {
  return ENTIDADE_VAGA_TYPES.includes(value as EntidadeVagaType);
}
