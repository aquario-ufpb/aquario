import { prisma } from "@/lib/server/db/prisma";
import type { ICursosRepository } from "@/lib/server/db/interfaces/cursos-repository.interface";
import type { Curso } from "@/lib/server/db/interfaces/types";

export class PrismaCursosRepository implements ICursosRepository {
  async findById(id: string): Promise<Curso | null> {
    return await prisma.curso.findUnique({ where: { id } });
  }

  async findByCentroId(centroId: string): Promise<Curso[]> {
    return await prisma.curso.findMany({ where: { centroId }, orderBy: { nome: "asc" } });
  }

  async findAll(): Promise<Curso[]> {
    return await prisma.curso.findMany({ orderBy: { nome: "asc" } });
  }

  async create(data: { nome: string; centroId: string }): Promise<Curso> {
    return await prisma.curso.create({ data });
  }

  async update(id: string, data: { nome: string; centroId: string }): Promise<Curso | null> {
    try {
      return await prisma.curso.update({ where: { id }, data });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.curso.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async countDependencies(
    id: string
  ): Promise<{ curriculos: number; guias: number; usuarios: number }> {
    const [curriculos, guias, usuarios] = await Promise.all([
      prisma.curriculo.count({ where: { cursoId: id } }),
      prisma.guia.count({ where: { cursoId: id } }),
      prisma.usuario.count({ where: { cursoId: id } }),
    ]);
    return { curriculos, guias, usuarios };
  }
}
