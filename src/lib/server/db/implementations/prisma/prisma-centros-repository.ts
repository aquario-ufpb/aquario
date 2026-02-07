import { prisma } from "@/lib/server/db/prisma";
import type { ICentrosRepository } from "@/lib/server/db/interfaces/centros-repository.interface";
import type { Centro } from "@/lib/server/db/interfaces/types";

export class PrismaCentrosRepository implements ICentrosRepository {
  async findById(id: string): Promise<Centro | null> {
    return await prisma.centro.findUnique({ where: { id } });
  }

  async findMany(): Promise<Centro[]> {
    return await prisma.centro.findMany({ orderBy: { sigla: "asc" } });
  }

  async create(data: {
    nome: string;
    sigla: string;
    descricao: string | null;
    campusId: string;
  }): Promise<Centro> {
    return await prisma.centro.create({ data });
  }

  async update(
    id: string,
    data: { nome: string; sigla: string; descricao: string | null; campusId?: string }
  ): Promise<Centro | null> {
    try {
      return await prisma.centro.update({ where: { id }, data });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.centro.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async countDependencies(id: string): Promise<{ cursos: number }> {
    const cursos = await prisma.curso.count({ where: { centroId: id } });
    return { cursos };
  }
}
