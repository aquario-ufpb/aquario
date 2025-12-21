import type { ISecoesGuiaRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { SecaoGuiaWithRelations } from "@/lib/server/db/interfaces/types";

export class InMemorySecoesGuiaRepository implements ISecoesGuiaRepository {
  private secoes: SecaoGuiaWithRelations[] = [];

  async findByGuiaId(guiaId: string): Promise<SecaoGuiaWithRelations[]> {
    return this.secoes
      .filter((s) => s.guiaId === guiaId)
      .sort((a, b) => a.ordem - b.ordem);
  }

  async findById(id: string): Promise<SecaoGuiaWithRelations | null> {
    return this.secoes.find((s) => s.id === id) ?? null;
  }

  // Helper for testing
  addSecao(secao: SecaoGuiaWithRelations): void {
    this.secoes.push(secao);
  }

  clear(): void {
    this.secoes = [];
  }
}

