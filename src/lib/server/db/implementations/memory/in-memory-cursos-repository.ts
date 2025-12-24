import type { ICursosRepository } from "@/lib/server/db/interfaces/cursos-repository.interface";
import type { Curso } from "@/lib/server/db/interfaces/types";

export class InMemoryCursosRepository implements ICursosRepository {
  private cursos: Curso[] = [
    {
      id: "curso-1",
      nome: "Ciência da Computação",
      centroId: "centro-1",
    },
    {
      id: "curso-2",
      nome: "Engenharia da Computação",
      centroId: "centro-1",
    },
    {
      id: "curso-3",
      nome: "Matemática",
      centroId: "centro-2",
    },
  ];

  findById(id: string): Promise<Curso | null> {
    return Promise.resolve(this.cursos.find(c => c.id === id) ?? null);
  }

  findByCentroId(centroId: string): Promise<Curso[]> {
    return Promise.resolve(
      this.cursos.filter(c => c.centroId === centroId).sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  // Helper for testing
  addCurso(curso: Curso): void {
    this.cursos.push(curso);
  }

  clear(): void {
    this.cursos = [];
  }
}
