import { prisma } from "@/lib/server/db/prisma";
import type { ISubSecoesGuiaRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { SubSecaoGuia } from "@/lib/server/db/interfaces/types";

export class PrismaSubSecoesGuiaRepository implements ISubSecoesGuiaRepository {
  async findBySecaoId(secaoId: string): Promise<SubSecaoGuia[]> {
    const subSecoes = await prisma.subSecaoGuia.findMany({
      where: { secaoId },
      orderBy: {
        ordem: "asc",
      },
    });

    return subSecoes;
  }

  async findById(id: string): Promise<SubSecaoGuia | null> {
    const subSecao = await prisma.subSecaoGuia.findUnique({
      where: { id },
    });

    return subSecao;
  }
}

