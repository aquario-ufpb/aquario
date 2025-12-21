// Export all types from a single file
export * from "./guia.types";
export * from "./curso.types";
export * from "./centro.types";
export * from "./entidade.types";
export * from "./membro.types";
export * from "./paas.types";

// Re-export database types for server-side code that needs both
// These are Prisma-generated types - use with caution on client-side
export type {
  Campus,
  Centro as CentroDB,
  Curso as CursoDB,
  Usuario,
  TokenVerificacao,
  Entidade as EntidadeDB,
  MembroEntidade,
  Guia as GuiaDB,
  SecaoGuia,
  SubSecaoGuia,
  PapelPlataforma,
  TipoToken,
  TipoEntidade as TipoEntidadeDB,
  PapelMembro as PapelMembroDB,
  StatusGuia,
} from "@prisma/client";
