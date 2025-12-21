import { prisma } from "@/lib/server/db/prisma";
import type { IGuiasRepository } from "@/lib/server/db/interfaces/guias-repository.interface";
import type { GuiaWithRelations } from "@/lib/server/db/interfaces/types";

export class PrismaGuiasRepository implements IGuiasRepository {
  async findMany(): Promise<GuiaWithRelations[]> {
    const guias = await prisma.guia.findMany({
      include: {
        curso: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return guias;
  }

  async findById(id: string): Promise<GuiaWithRelations | null> {
    const guia = await prisma.guia.findUnique({
      where: { id },
      include: {
        curso: true,
        secoes: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return guia;
  }

  async findBySlug(slug: string): Promise<GuiaWithRelations | null> {
    const guia = await prisma.guia.findUnique({
      where: { slug },
      include: {
        curso: true,
        secoes: {
          orderBy: { ordem: "asc" },
        },
      },
    });

    return guia;
  }

  async findByCursoId(cursoId: string): Promise<GuiaWithRelations[]> {
    const guias = await prisma.guia.findMany({
      where: { cursoId },
      include: {
        curso: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return guias;
  }
}

