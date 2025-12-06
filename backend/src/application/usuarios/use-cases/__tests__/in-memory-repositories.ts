import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { ICentrosRepository } from '@/domain/centros/repositories/ICentrosRepository';
import { ICursosRepository } from '@/domain/cursos/repositories/ICursosRepository';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import { Centro, Curso, TipoToken } from '@prisma/client';

export class InMemoryUsuariosRepository implements IUsuariosRepository {
  public items: Usuario[] = [];

  async create(usuario: Usuario): Promise<void> {
    this.items.push(usuario);
  }

  async findById(id: string): Promise<Usuario | null> {
    const usuario = this.items.find(item => item.id === id);
    return usuario ?? null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = this.items.find(item => item.email === normalizedEmail);
    return usuario ?? null;
  }

  async findMany(): Promise<Usuario[]> {
    return this.items;
  }

  async markAsVerified(id: string): Promise<void> {
    const usuario = this.items.find(item => item.id === id);
    if (usuario) {
      usuario.props.eVerificado = true;
    }
  }

  async updatePassword(id: string, senhaHash: string): Promise<void> {
    const usuario = this.items.find(item => item.id === id);
    if (usuario) {
      usuario.props.senhaHash = senhaHash;
    }
  }

  async updatePapelPlataforma(id: string, papelPlataforma: 'USER' | 'MASTER_ADMIN'): Promise<void> {
    const usuario = this.items.find(item => item.id === id);
    if (usuario) {
      usuario.props.papelPlataforma = papelPlataforma;
    }
  }

  // Helper method for tests
  clear(): void {
    this.items = [];
  }
}

export class InMemoryCentrosRepository implements ICentrosRepository {
  constructor(private centros: Centro[] = []) {}

  async findById(id: string): Promise<Centro | null> {
    return this.centros.find(centro => centro.id === id) ?? null;
  }

  async findMany(): Promise<Centro[]> {
    return this.centros;
  }

  // Helper method for tests
  addCentro(centro: Centro): void {
    this.centros.push(centro);
  }
}

export class InMemoryCursosRepository implements ICursosRepository {
  constructor(private cursos: Curso[] = []) {}

  async findById(id: string): Promise<Curso | null> {
    return this.cursos.find(curso => curso.id === id) ?? null;
  }

  async findByCentroId(centroId: string): Promise<Curso[]> {
    return this.cursos.filter(curso => curso.centroId === centroId);
  }

  // Helper method for tests
  addCurso(curso: Curso): void {
    this.cursos.push(curso);
  }
}

export class InMemoryTokenVerificacaoRepository implements ITokenVerificacaoRepository {
  public items: TokenVerificacao[] = [];

  async create(token: TokenVerificacao): Promise<void> {
    this.items.push(token);
  }

  async findByToken(token: string): Promise<TokenVerificacao | null> {
    const found = this.items.find(item => item.token === token);
    return found ?? null;
  }

  async findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null> {
    const tokens = this.items
      .filter(item => item.usuarioId === usuarioId && item.tipo === tipo)
      .sort((a, b) => {
        const aDate = a.criadoEm ?? new Date(0);
        const bDate = b.criadoEm ?? new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
    return tokens[0] ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    const token = this.items.find(item => item.id === id);
    if (token) {
      token.markAsUsed();
    }
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.expiraEm > now);
    return initialLength - this.items.length;
  }

  async deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void> {
    this.items = this.items.filter(item => !(item.usuarioId === usuarioId && item.tipo === tipo));
  }

  // Helper method for tests
  clear(): void {
    this.items = [];
  }
}
