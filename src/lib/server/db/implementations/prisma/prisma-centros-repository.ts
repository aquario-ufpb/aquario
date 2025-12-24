import { prisma } from "@/lib/server/db/prisma";
import type { ICentrosRepository } from "@/lib/server/db/interfaces/centros-repository.interface";
import type { Centro } from "@/lib/server/db/interfaces/types";

export class PrismaCentrosRepository implements ICentrosRepository {
  async findById(id: string): Promise<Centro | null> {
    const centro = await prisma.centro.findUnique({
      where: { id },
    });

    return centro;
  }

  async findMany(): Promise<Centro[]> {
    const centros = await prisma.centro.findMany({
      orderBy: {
        sigla: "asc",
      },
    });

    return centros;
  }
}
