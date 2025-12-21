import type { ICentrosRepository } from "@/lib/server/db/interfaces/centros-repository.interface";
import type { Centro } from "@/lib/server/db/interfaces/types";

export class InMemoryCentrosRepository implements ICentrosRepository {
  private centros: Centro[] = [
    {
      id: "centro-1",
      nome: "Centro de Informática",
      sigla: "CI",
      descricao: "Centro de Informática da UFPB",
      campusId: "campus-1",
    },
    {
      id: "centro-2",
      nome: "Centro de Ciências Exatas e da Natureza",
      sigla: "CCEN",
      descricao: "Centro de Ciências Exatas e da Natureza da UFPB",
      campusId: "campus-1",
    },
  ];

  findById(id: string): Promise<Centro | null> {
    return Promise.resolve(this.centros.find(c => c.id === id) ?? null);
  }

  findMany(): Promise<Centro[]> {
    return Promise.resolve([...this.centros].sort((a, b) => a.sigla.localeCompare(b.sigla)));
  }

  // Helper for testing
  addCentro(centro: Centro): void {
    this.centros.push(centro);
  }

  clear(): void {
    this.centros = [];
  }
}
