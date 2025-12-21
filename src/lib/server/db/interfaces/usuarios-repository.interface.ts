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
   * List all users
   */
  findMany(): Promise<UsuarioWithRelations[]>;

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
   * Delete a user
   */
  delete(id: string): Promise<void>;
};
