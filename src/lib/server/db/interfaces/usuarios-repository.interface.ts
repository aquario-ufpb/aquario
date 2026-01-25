import type { UsuarioWithRelations, UsuarioCreateInput, PapelPlataforma } from "./types";

export type IUsuariosRepository = {
  /**
   * Create a new user
   */
  create(data: UsuarioCreateInput): Promise<UsuarioWithRelations>;

  /**
   * Find a user by ID
   */
  findById(id: string): Promise<UsuarioWithRelations | null>;

  /**
   * Find a user by email (case-insensitive)
   */
  findByEmail(email: string): Promise<UsuarioWithRelations | null>;

  /**
   * Find a user by slug
   */
  findBySlug(slug: string): Promise<UsuarioWithRelations | null>;

  /**
   * List all users
   */
  findMany(): Promise<UsuarioWithRelations[]>;

  /**
   * Find users with pagination
   */
  findManyPaginated(options: {
    page?: number;
    limit?: number;
    filter?: "all" | "facade" | "real";
    search?: string;
  }): Promise<{ users: UsuarioWithRelations[]; total: number }>;

  /**
   * Search users with limit (for autocomplete/search)
   */
  search(options: { query: string; limit?: number }): Promise<UsuarioWithRelations[]>;

  /**
   * Mark a user as email verified
   */
  markAsVerified(id: string): Promise<void>;

  /**
   * Update user's password hash
   */
  updatePassword(id: string, senhaHash: string): Promise<void>;

  /**
   * Update user's platform role
   */
  updatePapelPlataforma(id: string, papelPlataforma: PapelPlataforma): Promise<void>;

  /**
   * Update user's profile photo URL
   */
  updateFotoPerfil(id: string, urlFotoPerfil: string | null): Promise<void>;

  /**
   * Update user's centro
   */
  updateCentro(id: string, centroId: string): Promise<void>;

  /**
   * Update user's curso
   */
  updateCurso(id: string, cursoId: string): Promise<void>;

  /**
   * Update user's slug
   */
  updateSlug(id: string, slug: string | null): Promise<void>;

  /**
   * Delete a user
   */
  delete(id: string): Promise<void>;
};
