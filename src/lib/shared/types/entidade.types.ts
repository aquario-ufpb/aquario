/**
 * Entity type definitions
 */

import type { Membro } from "./membro.types";

export type TipoEntidade =
  | "LABORATORIO"
  | "CENTRO_ACADEMICO"
  | "ATLETICA"
  | "LIGA_ACADEMICA"
  | "GRUPO"
  | "OUTRO"
  | "EMPRESA";

/**
 * Entity type
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
  order?: number | null;
  membros?: Membro[];
  centro?: {
    id: string;
    nome: string;
    sigla: string;
  } | null;
};
