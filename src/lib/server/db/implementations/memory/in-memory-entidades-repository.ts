import type { IEntidadesRepository } from "@/lib/server/db/interfaces/entidades-repository.interface";
import type { EntidadeWithRelations, EntidadeUpdateInput } from "@/lib/server/db/interfaces/types";

export class InMemoryEntidadesRepository implements IEntidadesRepository {
  private entidades: EntidadeWithRelations[] = [];

  findMany(): Promise<EntidadeWithRelations[]> {
    return Promise.resolve([...this.entidades].sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  findById(id: string): Promise<EntidadeWithRelations | null> {
    return Promise.resolve(this.entidades.find(e => e.id === id) ?? null);
  }

  findBySlug(slug: string): Promise<EntidadeWithRelations | null> {
    // Normalize slug to lowercase for case-insensitive lookup
    const normalizedSlug = slug.toLowerCase();
    return Promise.resolve(this.entidades.find(e => e.slug?.toLowerCase() === normalizedSlug) ?? null);
  }

  update(id: string, data: EntidadeUpdateInput): Promise<void> {
    const entidade = this.entidades.find(e => e.id === id);
    if (!entidade) {
      return Promise.resolve();
    }

    if (data.nome !== undefined) {
      entidade.nome = data.nome;
    }
    if (data.slug !== undefined) {
      // Normalize slug to lowercase for case-insensitive uniqueness
      entidade.slug = data.slug ? data.slug.toLowerCase().trim() : null;
    }
    if (data.subtitle !== undefined) {
      entidade.subtitle = data.subtitle;
    }
    if (data.descricao !== undefined) {
      entidade.descricao = data.descricao;
    }
    if (data.tipo !== undefined) {
      entidade.tipo = data.tipo;
    }
    if (data.urlFoto !== undefined) {
      entidade.urlFoto = data.urlFoto;
    }
    if (data.contato !== undefined) {
      entidade.contato = data.contato;
    }
    if (data.instagram !== undefined) {
      entidade.instagram = data.instagram;
    }
    if (data.linkedin !== undefined) {
      entidade.linkedin = data.linkedin;
    }
    if (data.website !== undefined) {
      entidade.website = data.website;
    }
    if (data.location !== undefined) {
      entidade.location = data.location;
    }
    if (data.foundingDate !== undefined) {
      entidade.foundingDate = data.foundingDate;
    }
    if (data.metadata !== undefined) {
      entidade.metadata = data.metadata;
    }

    return Promise.resolve();
  }

  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Helper for testing
  addEntidade(entidade: EntidadeWithRelations): void {
    this.entidades.push(entidade);
  }

  clear(): void {
    this.entidades = [];
  }
}
