import { prisma } from "@/lib/server/db/prisma";
import type { ICampusRepository } from "@/lib/server/db/interfaces/campus-repository.interface";
import type { Campus } from "@/lib/server/db/interfaces/types";

export class PrismaCampusRepository implements ICampusRepository {
  async findById(id: string): Promise<Campus | null> {
    return await prisma.campus.findUnique({ where: { id } });
  }

  async findByNome(nome: string): Promise<Campus | null> {
    return await prisma.campus.findUnique({ where: { nome } });
  }

  async findMany(): Promise<Campus[]> {
    return await prisma.campus.findMany({ orderBy: { nome: "asc" } });
  }

  async create(data: { nome: string }): Promise<Campus> {
    return await prisma.campus.create({ data });
  }

  async update(id: string, data: { nome: string }): Promise<Campus | null> {
    try {
      return await prisma.campus.update({ where: { id }, data });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.campus.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async countDependencies(id: string): Promise<{ centros: number }> {
    const centros = await prisma.centro.count({ where: { campusId: id } });
    return { centros };
  }
}
