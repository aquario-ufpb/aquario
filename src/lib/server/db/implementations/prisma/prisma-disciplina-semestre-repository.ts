import { prisma } from "@/lib/server/db/prisma";
import type {
  IDisciplinaSemestreRepository,
  DisciplinaSemestre,
  CreateDisciplinaSemestreInput,
} from "@/lib/server/db/interfaces/disciplina-semestre-repository.interface";

export class PrismaDisciplinaSemestreRepository implements IDisciplinaSemestreRepository {
  findByUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestre[]> {
    return prisma.disciplinaSemestre.findMany({
      where: { usuarioId, semestreLetivoId },
    });
  }

  async replaceForUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string,
    records: CreateDisciplinaSemestreInput[]
  ): Promise<DisciplinaSemestre[]> {
    return await prisma.$transaction(async tx => {
      await tx.disciplinaSemestre.deleteMany({
        where: { usuarioId, semestreLetivoId },
      });

      if (records.length > 0) {
        await tx.disciplinaSemestre.createMany({
          data: records.map(r => ({
            usuarioId,
            semestreLetivoId,
            disciplinaId: r.disciplinaId,
            turma: r.turma ?? null,
            docente: r.docente ?? null,
            horario: r.horario ?? null,
            codigoPaas: r.codigoPaas ?? null,
          })),
          skipDuplicates: true,
        });
      }

      return tx.disciplinaSemestre.findMany({
        where: { usuarioId, semestreLetivoId },
      });
    });
  }
}
