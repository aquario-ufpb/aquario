import { prisma } from "@/lib/server/db/prisma";
import type { ISecoesGuiaRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { SecaoGuiaWithRelations } from "@/lib/server/db/interfaces/types";

export class PrismaSecoesGuiaRepository implements ISecoesGuiaRepository {
  async findByGuiaId(guiaId: string): Promise<SecaoGuiaWithRelations[]> {
    const secoes = await prisma.secaoGuia.findMany({
      where: { guiaId },
      include: {
        subsecoes: {
          orderBy: { ordem: "asc" },
        },
      },
      orderBy: {
        ordem: "asc",
      },
    });

    return secoes;
  }

  async findById(id: string): Promise<SecaoGuiaWithRelations | null> {
    const secao = await prisma.secaoGuia.findUnique({
      where: { id },
      include: {
        subsecoes: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return secao;
  }
}

