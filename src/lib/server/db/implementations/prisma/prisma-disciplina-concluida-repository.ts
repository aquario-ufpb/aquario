import { prisma } from "@/lib/server/db/prisma";
import type { IDisciplinaConcluidaRepository } from "@/lib/server/db/interfaces/disciplina-concluida-repository.interface";

export class PrismaDisciplinaConcluidaRepository implements IDisciplinaConcluidaRepository {
  async findByUsuario(usuarioId: string): Promise<string[]> {
    const records = await prisma.disciplinaConcluida.findMany({
      where: { usuarioId },
      select: { disciplinaId: true },
    });
    return records.map(r => r.disciplinaId);
  }

  async replaceForUsuario(usuarioId: string, disciplinaIds: string[]): Promise<void> {
    await prisma.$transaction(async tx => {
      await tx.disciplinaConcluida.deleteMany({
        where: { usuarioId },
      });

      if (disciplinaIds.length > 0) {
        await tx.disciplinaConcluida.createMany({
          data: disciplinaIds.map(disciplinaId => ({
            usuarioId,
            disciplinaId,
          })),
          skipDuplicates: true,
        });
      }
    });
  }
}
