import type { ISubSecoesGuiaRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { SubSecaoGuia } from "@/lib/server/db/interfaces/types";

export class InMemorySubSecoesGuiaRepository implements ISubSecoesGuiaRepository {
  private subSecoes: SubSecaoGuia[] = [];

  async findBySecaoId(secaoId: string): Promise<SubSecaoGuia[]> {
    return this.subSecoes
      .filter((s) => s.secaoId === secaoId)
      .sort((a, b) => a.ordem - b.ordem);
  }

  async findById(id: string): Promise<SubSecaoGuia | null> {
    return this.subSecoes.find((s) => s.id === id) ?? null;
  }

  // Helper for testing
  addSubSecao(subSecao: SubSecaoGuia): void {
    this.subSecoes.push(subSecao);
  }

  clear(): void {
    this.subSecoes = [];
  }
}

