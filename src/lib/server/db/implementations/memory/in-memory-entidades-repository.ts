import type { IEntidadesRepository } from "@/lib/server/db/interfaces/entidades-repository.interface";
import type { EntidadeWithRelations, EntidadeUpdateInput } from "@/lib/server/db/interfaces/types";

export class InMemoryEntidadesRepository implements IEntidadesRepository {
  private entidades: EntidadeWithRelations[] = [];

  async findMany(): Promise<EntidadeWithRelations[]> {
    return [...this.entidades].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async findById(id: string): Promise<EntidadeWithRelations | null> {
    return this.entidades.find((e) => e.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<EntidadeWithRelations | null> {
    // First check metadata slug
    const byMetadata = this.entidades.find((e) => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return metadata?.slug === slug;
    });

    if (byMetadata) return byMetadata;

    // Fallback to generated slug
    return (
      this.entidades.find((e) => this.nomeToSlug(e.nome) === slug) ?? null
    );
  }

  async update(id: string, data: EntidadeUpdateInput): Promise<void> {
    const entidade = this.entidades.find((e) => e.id === id);
    if (!entidade) return;

    if (data.nome !== undefined) entidade.nome = data.nome;
    if (data.subtitle !== undefined) entidade.subtitle = data.subtitle;
    if (data.descricao !== undefined) entidade.descricao = data.descricao;
    if (data.tipo !== undefined) entidade.tipo = data.tipo;
    if (data.urlFoto !== undefined) entidade.urlFoto = data.urlFoto;
    if (data.contato !== undefined) entidade.contato = data.contato;
    if (data.instagram !== undefined) entidade.instagram = data.instagram;
    if (data.linkedin !== undefined) entidade.linkedin = data.linkedin;
    if (data.website !== undefined) entidade.website = data.website;
    if (data.location !== undefined) entidade.location = data.location;
    if (data.foundingDate !== undefined) entidade.foundingDate = data.foundingDate;
    if (data.metadata !== undefined) entidade.metadata = data.metadata;
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

