import { Usuario } from '../entities/Usuario';

export interface IUsuariosRepository {
  create(usuario: Usuario): Promise<void>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findMany(): Promise<Usuario[]>;
  markAsVerified(id: string): Promise<void>;
  updatePassword(id: string, senhaHash: string): Promise<void>;
  updatePapelPlataforma(id: string, papelPlataforma: 'USER' | 'MASTER_ADMIN'): Promise<void>;
}
