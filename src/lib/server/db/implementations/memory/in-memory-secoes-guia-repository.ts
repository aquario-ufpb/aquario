import type { ISecoesGuiaRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { SecaoGuiaWithRelations } from "@/lib/server/db/interfaces/types";

export class InMemorySecoesGuiaRepository implements ISecoesGuiaRepository {
  private secoes: SecaoGuiaWithRelations[] = [];

  findByGuiaId(guiaId: string): Promise<SecaoGuiaWithRelations[]> {
    return Promise.resolve(
      this.secoes.filter(s => s.guiaId === guiaId).sort((a, b) => a.ordem - b.ordem)
    );
  }

  findById(id: string): Promise<SecaoGuiaWithRelations | null> {
    return Promise.resolve(this.secoes.find(s => s.id === id) ?? null);
  }

  // Helper for testing
  addSecao(secao: SecaoGuiaWithRelations): void {
    this.secoes.push(secao);
  }

  clear(): void {
    this.secoes = [];
  }
}
