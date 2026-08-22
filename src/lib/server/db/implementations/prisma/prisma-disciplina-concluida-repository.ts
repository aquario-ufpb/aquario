import { prisma } from "@/lib/server/db/prisma";
import type {
  CompletedDiscipline,
  IDisciplinaConcluidaRepository,
} from "@/lib/server/db/interfaces/disciplina-concluida-repository.interface";

export class PrismaDisciplinaConcluidaRepository implements IDisciplinaConcluidaRepository {
  async findByUsuario(usuarioId: string): Promise<CompletedDiscipline[]> {
    const records = await prisma.disciplinaConcluida.findMany({
      where: { usuarioId },
      orderBy: { concluidaEm: "asc" },
      select: {
        disciplinaId: true,
        disciplina: { select: { codigo: true, nome: true } },
      },
    });
    return records.map(record => ({
      disciplinaId: record.disciplinaId,
      code: record.disciplina.codigo,
      name: record.disciplina.nome,
    }));
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
