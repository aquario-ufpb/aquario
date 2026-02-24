/**
 * Vaga (Job/Opportunity) type definitions
 */

/**
 * Types of opportunities available
 */
export const TipoVaga = {
  ESTAGIO: "ESTAGIO",
  TRAINEE: "TRAINEE",
  VOLUNTARIO: "VOLUNTARIO",
  PESQUISA: "PESQUISA",
  CLT: "CLT",
  PJ: "PJ",
  OUTRO: "OUTRO",
} as const;

export type TipoVaga = (typeof TipoVaga)[keyof typeof TipoVaga];

/**
 * Categories of entities that can post opportunities
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

export type EntidadeVaga = EntidadeVagaType;

/**
 * Display labels for entity vaga types (Portuguese)
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
 * Short labels for entity vaga types (for badges)
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

/**
 * Publisher information for an opportunity
 */
export type Publicador = {
  nome: string;
  urlFotoPerfil?: string | null;
};

/**
 * Entidade info when vaga comes from backend API
 */
export type VagaEntidadeInfo = {
  id: string;
  nome: string;
  slug?: string;
  tipo?: string;
  urlFoto?: string;
};

/**
 * Job/Opportunity posting
 * entidade: legacy string (EntidadeVaga) from file provider, or object from backend
 * linkVaga: deprecated, use linkInscricao
 */
export type Vaga = {
  id: string;
  titulo: string;
  descricao: string;
  tipoVaga: TipoVaga;
  areas: string[];
  publicador: Publicador;
  criadoEm: string;
  entidade: EntidadeVaga | VagaEntidadeInfo;
  prazo?: string;
  salario?: string;
  sobreEmpresa?: string;
  responsabilidades: string[];
  requisitos: string[];
  informacoesAdicionais?: string;
  etapasProcesso: string[];
  /** Link para inscrição (preferido) */
  linkInscricao?: string;
  /** @deprecated use linkInscricao */
  linkVaga?: string;
  /** Data de finalização (ISO string); após esta data a vaga não aparece no mural */
  dataFinalizacao?: string;
};
