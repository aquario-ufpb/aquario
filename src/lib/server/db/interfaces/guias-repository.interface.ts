import type { GuiaWithRelations, SecaoGuiaWithRelations, SubSecaoGuia } from "./types";

export type IGuiasRepository = {
  /**
   * List all guias
   */
  findMany(): Promise<GuiaWithRelations[]>;

  /**
   * Find a guia by ID
   */
  findById(id: string): Promise<GuiaWithRelations | null>;

  /**
   * Find a guia by slug
   */
  findBySlug(slug: string): Promise<GuiaWithRelations | null>;

  /**
   * Find guias by curso ID
   */
  findByCursoId(cursoId: string): Promise<GuiaWithRelations[]>;
};

export type ISecoesGuiaRepository = {
  /**
   * Find all secoes for a guia
   */
  findByGuiaId(guiaId: string): Promise<SecaoGuiaWithRelations[]>;

  /**
   * Find a secao by ID
   */
  findById(id: string): Promise<SecaoGuiaWithRelations | null>;
};

export type ISubSecoesGuiaRepository = {
  /**
   * Find all subsecoes for a secao
   */
  findBySecaoId(secaoId: string): Promise<SubSecaoGuia[]>;

  /**
   * Find a subsecao by ID
   */
  findById(id: string): Promise<SubSecaoGuia | null>;
};
