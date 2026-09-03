import { prisma } from "@/lib/server/db/prisma";
import type {
  IDisciplinaSemestreRepository,
  DisciplinaSemestre,
  DisciplinaSemestreWithDisciplina,
  CreateDisciplinaSemestreInput,
  UpdateDisciplinaSemestreFields,
  MarcarStatus,
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

  async findByUsuarioAndSemestreWithDisciplina(
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestreWithDisciplina[]> {
    const records = await prisma.disciplinaSemestre.findMany({
      where: { usuarioId, semestreLetivoId },
      include: {
        disciplina: {
          select: {
            codigo: true,
            nome: true,
          },
        },
      },
      orderBy: { criadoEm: "asc" },
    });

    return records as DisciplinaSemestreWithDisciplina[];
  }

  async findOneOwned(
    id: string,
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestre | null> {
    const record = await prisma.disciplinaSemestre.findUnique({
      where: { id },
    });

    if (!record || record.usuarioId !== usuarioId || record.semestreLetivoId !== semestreLetivoId) {
      return null;
    }

    return record;
  }

  async updateFields(
    id: string,
    data: UpdateDisciplinaSemestreFields
  ): Promise<DisciplinaSemestreWithDisciplina> {
    const updateData: Record<string, unknown> = {};
    if (data.turma !== undefined) {
      updateData.turma = data.turma ?? null;
    }
    if (data.docente !== undefined) {
      updateData.docente = data.docente ?? null;
    }
    if (data.horario !== undefined) {
      updateData.horario = data.horario ?? null;
    }
    if (data.codigoPaas !== undefined) {
      updateData.codigoPaas = data.codigoPaas ?? null;
    }

    const record = await prisma.disciplinaSemestre.update({
      where: { id },
      data: updateData,
      include: { disciplina: { select: { codigo: true, nome: true } } },
    });

    return record as DisciplinaSemestreWithDisciplina;
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

  async marcarDisciplinas(
    usuarioId: string,
    disciplinaIds: string[],
    status: MarcarStatus,
    semestreLetivoId: string | null,
    expectedCursoId?: string,
    expectedCurriculoId?: string
  ): Promise<void> {
    await prisma.$transaction(async tx => {
      if (expectedCursoId) {
        const [lockedUser] = await tx.$queryRaw<Array<{ cursoId: string }>>`
          SELECT "cursoId" FROM "Usuario" WHERE "id" = ${usuarioId} FOR UPDATE
        `;
        if (!lockedUser || lockedUser.cursoId !== expectedCursoId) {
          throw new Error("COURSE_CHANGED_DURING_DISCIPLINE_CONFIRMATION");
        }

        if (status !== "none") {
          const [lockedCurriculum] = await tx.$queryRaw<
            Array<{ id: string; cursoId: string; ativo: boolean }>
          >`
            SELECT "id", "cursoId", "ativo" FROM "Curriculo"
            WHERE "id" = ${expectedCurriculoId ?? ""} FOR UPDATE
          `;
          if (
            !lockedCurriculum ||
            lockedCurriculum.cursoId !== expectedCursoId ||
            !lockedCurriculum.ativo
          ) {
            throw new Error("DISCIPLINE_OUTSIDE_ACTIVE_CURRICULUM");
          }

          const matchingDisciplines = await tx.curriculoDisciplina.count({
            where: {
              disciplinaId: { in: disciplinaIds },
              curriculoId: lockedCurriculum.id,
            },
          });
          if (matchingDisciplines !== new Set(disciplinaIds).size) {
            throw new Error("DISCIPLINE_OUTSIDE_ACTIVE_CURRICULUM");
          }
        }
      }

      // Build the disciplinaSemestre delete filter — scoped to semester if available,
      // otherwise removes across all semesters to prevent inconsistent state
      const semestreFilter = semestreLetivoId
        ? { usuarioId, semestreLetivoId, disciplinaId: { in: disciplinaIds } }
        : { usuarioId, disciplinaId: { in: disciplinaIds } };

      if (status === "concluida") {
        await tx.disciplinaSemestre.deleteMany({ where: semestreFilter });
        await tx.disciplinaConcluida.createMany({
          data: disciplinaIds.map(disciplinaId => ({
            usuarioId,
            disciplinaId,
          })),
          skipDuplicates: true,
        });
      } else if (status === "cursando") {
        if (!semestreLetivoId) {
          throw new Error("NO_ACTIVE_SEMESTER");
        }
        await tx.disciplinaConcluida.deleteMany({
          where: {
            usuarioId,
            disciplinaId: { in: disciplinaIds },
          },
        });
        await tx.disciplinaSemestre.createMany({
          data: disciplinaIds.map(disciplinaId => ({
            usuarioId,
            semestreLetivoId,
            disciplinaId,
          })),
          skipDuplicates: true,
        });
      } else {
        await tx.disciplinaConcluida.deleteMany({
          where: {
            usuarioId,
            disciplinaId: { in: disciplinaIds },
          },
        });
        await tx.disciplinaSemestre.deleteMany({ where: semestreFilter });
      }
    });
  }
}
