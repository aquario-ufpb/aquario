import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type {
  UsuarioWithRelations,
  UsuarioCreateInput,
  PapelPlataforma,
  Centro,
  Curso,
} from "@/lib/server/db/interfaces/types";
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

  create(data: UsuarioCreateInput): Promise<UsuarioWithRelations> {
    const usuario: UsuarioWithRelations = {
      id: randomUUID(),
      nome: data.nome,
      email: data.email ? data.email.toLowerCase().trim() : null,
      senhaHash: data.senhaHash ?? null,
      centroId: data.centroId,
      cursoId: data.cursoId,
      permissoes: data.permissoes ?? [],
      papelPlataforma: data.papelPlataforma ?? "USER",
      eVerificado: data.eVerificado ?? false,
      eFacade: data.eFacade ?? false,
      urlFotoPerfil: data.urlFotoPerfil ?? null,
      matricula: data.matricula ?? null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      centro: this.defaultCentro,
      curso: this.defaultCurso,
    };

    this.usuarios.push(usuario);
    return Promise.resolve(usuario);
  }

  findById(id: string): Promise<UsuarioWithRelations | null> {
    return Promise.resolve(this.usuarios.find(u => u.id === id) ?? null);
  }

  findByEmail(email: string): Promise<UsuarioWithRelations | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return Promise.resolve(this.usuarios.find(u => u.email === normalizedEmail) ?? null);
  }

  findMany(): Promise<UsuarioWithRelations[]> {
    return Promise.resolve([...this.usuarios].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  findManyPaginated(options: {
    page?: number;
    limit?: number;
    filter?: "all" | "facade" | "real";
  }): Promise<{ users: UsuarioWithRelations[]; total: number }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const skip = (page - 1) * limit;
    const filter = options.filter ?? "all";

    // Filter users based on filter option
    let filteredUsers = [...this.usuarios];
    if (filter === "facade") {
      filteredUsers = filteredUsers.filter(u => u.eFacade);
    } else if (filter === "real") {
      filteredUsers = filteredUsers.filter(u => !u.eFacade);
    }

    const sorted = filteredUsers.sort((a, b) => a.nome.localeCompare(b.nome));
    const users = sorted.slice(skip, skip + limit);
    const total = filteredUsers.length;

    return Promise.resolve({ users, total });
  }

  search(options: { query: string; limit?: number }): Promise<UsuarioWithRelations[]> {
    const limit = options.limit ?? 10;
    const searchQuery = options.query.trim().toLowerCase();

    if (!searchQuery) {
      return Promise.resolve([]);
    }

    // Normalize query for accent-insensitive search
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    const normalizedQuery = normalizeString(searchQuery);

    const filtered = this.usuarios.filter(u => {
      const normalizedNome = normalizeString(u.nome);
      const normalizedEmail = u.email ? normalizeString(u.email) : "";
      const normalizedCentroNome = normalizeString(u.centro.nome);
      const normalizedCentroSigla = normalizeString(u.centro.sigla);
      const normalizedCursoNome = normalizeString(u.curso.nome);

      return (
        normalizedNome.includes(normalizedQuery) ||
        normalizedEmail.includes(normalizedQuery) ||
        normalizedCentroNome.includes(normalizedQuery) ||
        normalizedCentroSigla.includes(normalizedQuery) ||
        normalizedCursoNome.includes(normalizedQuery)
      );
    });

    const sorted = filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    return Promise.resolve(sorted.slice(0, limit));
  }

  markAsVerified(id: string): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.eVerificado = true;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  updatePassword(id: string, senhaHash: string): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.senhaHash = senhaHash;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  updatePapelPlataforma(id: string, papelPlataforma: PapelPlataforma): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.papelPlataforma = papelPlataforma;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  updateFotoPerfil(id: string, urlFotoPerfil: string | null): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.urlFotoPerfil = urlFotoPerfil;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  updateCentro(id: string, centroId: string): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.centroId = centroId;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  updateCurso(id: string, cursoId: string): Promise<void> {
    const usuario = this.usuarios.find(u => u.id === id);
    if (usuario) {
      usuario.cursoId = cursoId;
      usuario.atualizadoEm = new Date();
    }
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    const index = this.usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
      this.usuarios.splice(index, 1);
    }
    return Promise.resolve();
  }

  // Helper for testing
  clear(): void {
    this.usuarios = [];
  }
}
