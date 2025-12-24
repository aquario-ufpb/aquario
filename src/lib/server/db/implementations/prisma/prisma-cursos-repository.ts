import { prisma } from "@/lib/server/db/prisma";
import type { ICursosRepository } from "@/lib/server/db/interfaces/cursos-repository.interface";
import type { Curso } from "@/lib/server/db/interfaces/types";

export class PrismaCursosRepository implements ICursosRepository {
  async findById(id: string): Promise<Curso | null> {
    const curso = await prisma.curso.findUnique({
      where: { id },
    });

    return curso;
  }

  async findByCentroId(centroId: string): Promise<Curso[]> {
    const cursos = await prisma.curso.findMany({
      where: { centroId },
      orderBy: {
        nome: "asc",
      },
    });

    return cursos;
  }
}
