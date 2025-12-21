import type { IGuiasRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { GuiaWithRelations } from "@/lib/server/db/interfaces/types";

export class InMemoryGuiasRepository implements IGuiasRepository {
  private guias: GuiaWithRelations[] = [];

  async findMany(): Promise<GuiaWithRelations[]> {
    return [...this.guias].sort(
      (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  }

  async findById(id: string): Promise<GuiaWithRelations | null> {
    return this.guias.find((g) => g.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<GuiaWithRelations | null> {
    return this.guias.find((g) => g.slug === slug) ?? null;
  }

  async findByCursoId(cursoId: string): Promise<GuiaWithRelations[]> {
    return this.guias
      .filter((g) => g.cursoId === cursoId)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  }

  // Helper for testing
  addGuia(guia: GuiaWithRelations): void {
    this.guias.push(guia);
  }

  clear(): void {
    this.guias = [];
  }
}

