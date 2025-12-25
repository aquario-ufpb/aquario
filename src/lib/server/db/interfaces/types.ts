/**
 * Database types - Using Prisma types directly for simplicity
 * These are re-exported for use in interfaces and implementations
 */

import type {
  Campus,
  Centro,
  Curso,
  Usuario,
  TokenVerificacao,
  Entidade,
  MembroEntidade,
  Guia,
  SecaoGuia,
  SubSecaoGuia,
  PapelPlataforma,
  TipoToken,
  TipoEntidade,
  PapelMembro,
  StatusGuia,
  Prisma,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Campus,
  Centro,
  Curso,
  Usuario,
  TokenVerificacao,
  Entidade,
  MembroEntidade,
  Guia,
  SecaoGuia,
  SubSecaoGuia,
  PapelPlataforma,
  TipoToken,
  TipoEntidade,
  PapelMembro,
  StatusGuia,
};

// Extended types with relations
export type UsuarioWithRelations = Usuario & {
  centro: Centro;
  curso: Curso;
};

export type EntidadeWithRelations = Entidade & {
  centro?: Centro | null;
  membros?: (MembroEntidade & {
    usuario: Usuario & {
      curso?: Curso | null;
    };
  })[];
};

export type GuiaWithRelations = Guia & {
  curso?: Curso | null;
  secoes?: SecaoGuia[];
};

export type SecaoGuiaWithRelations = SecaoGuia & {
  subsecoes?: SubSecaoGuia[];
};

// Input types for creation
export type UsuarioCreateInput = {
  nome: string;
  email: string;
  senhaHash: string;
  centroId: string;
  cursoId: string;
  permissoes?: string[];
  papelPlataforma?: PapelPlataforma;
  eVerificado?: boolean;
  urlFotoPerfil?: string | null;
  matricula?: string | null;
};

export type TokenVerificacaoCreateInput = {
  usuarioId: string;
  token: string;
  tipo: TipoToken;
  expiraEm: Date;
};

export type EntidadeUpdateInput = {
  nome?: string;
  slug?: string | null;
  subtitle?: string | null;
  descricao?: string | null;
  tipo?: TipoEntidade;
  urlFoto?: string | null;
  contato?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  foundingDate?: Date | null;
  metadata?: Prisma.JsonValue;
};
