import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { UsuarioWithRelations, UsuarioCreateInput, PapelPlataforma, Centro, Curso } from "@/lib/server/db/interfaces/types";
import { randomUUID } from "crypto";

export class InMemoryUsuariosRepository implements IUsuariosRepository {
  private usuarios: UsuarioWithRelations[] = [];

  // Default centro and curso for testing
  private defaultCentro: Centro = {
    id: "centro-1",
    nome: "Centro de Informática",
    sigla: "CI",
    descricao: null,
    campusId: "campus-1",
  };

  private defaultCurso: Curso = {
    id: "curso-1",
    nome: "Ciência da Computação",
    centroId: "centro-1",
  };

  async create(data: UsuarioCreateInput): Promise<UsuarioWithRelations> {
    const usuario: UsuarioWithRelations = {
      id: randomUUID(),
      nome: data.nome,
      email: data.email.toLowerCase().trim(),
      senhaHash: data.senhaHash,
      centroId: data.centroId,
      cursoId: data.cursoId,
      permissoes: data.permissoes ?? [],
      papelPlataforma: data.papelPlataforma ?? "USER",
      eVerificado: data.eVerificado ?? false,
      urlFotoPerfil: data.urlFotoPerfil ?? null,
      matricula: data.matricula ?? null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      centro: this.defaultCentro,
      curso: this.defaultCurso,
    };

    this.usuarios.push(usuario);
    return usuario;
  }

  async findById(id: string): Promise<UsuarioWithRelations | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UsuarioWithRelations | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.usuarios.find((u) => u.email === normalizedEmail) ?? null;
  }

  async findMany(): Promise<UsuarioWithRelations[]> {
    return [...this.usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async markAsVerified(id: string): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) {
      usuario.eVerificado = true;
      usuario.atualizadoEm = new Date();
    }
  }

  async updatePassword(id: string, senhaHash: string): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) {
      usuario.senhaHash = senhaHash;
      usuario.atualizadoEm = new Date();
    }
  }

  async updatePapelPlataforma(id: string, papelPlataforma: PapelPlataforma): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) {
      usuario.papelPlataforma = papelPlataforma;
      usuario.atualizadoEm = new Date();
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.usuarios.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.usuarios.splice(index, 1);
    }
  }

  // Helper for testing
  clear(): void {
    this.usuarios = [];
  }
}

