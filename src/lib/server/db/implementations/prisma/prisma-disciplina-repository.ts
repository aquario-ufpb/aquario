import { prisma } from "@/lib/server/db/prisma";
import type {
  IDisciplinaRepository,
  DisciplinaSearchResult,
} from "@/lib/server/db/interfaces/disciplina-repository.interface";

export class PrismaDisciplinaRepository implements IDisciplinaRepository {
  search(query: string, limit = 20): Promise<DisciplinaSearchResult[]> {
    return prisma.disciplina.findMany({
      where: {
        OR: [
          { codigo: { contains: query, mode: "insensitive" } },
          { nome: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, codigo: true, nome: true },
      take: limit,
      orderBy: { nome: "asc" },
    });
  }

  findByCodigos(codigos: string[]): Promise<{ id: string; codigo: string }[]> {
    return prisma.disciplina.findMany({
      where: { codigo: { in: codigos } },
      select: { id: true, codigo: true },
    });
  }
}
