import type { EntidadeWithRelations, EntidadeUpdateInput } from "./types";

export type IEntidadesRepository = {
  /**
   * List all entidades with centro
   */
  findMany(): Promise<EntidadeWithRelations[]>;

  /**
   * Find an entidade by ID with all relations
   */
  findById(id: string): Promise<EntidadeWithRelations | null>;

  /**
   * Find an entidade by slug
   */
  findBySlug(slug: string): Promise<EntidadeWithRelations | null>;

  /**
   * Update an entidade
   */
  update(id: string, data: EntidadeUpdateInput): Promise<void>;
};
