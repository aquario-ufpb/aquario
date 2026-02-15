import { prisma } from "@/lib/server/db/prisma";
import type {
  ICalendarioRepository,
  SemestreLetivo,
  SemestreLetivoWithEventos,
  EventoCalendario,
  CreateSemestreInput,
  UpdateSemestreInput,
  CreateEventoInput,
  UpdateEventoInput,
} from "@/lib/server/db/interfaces/calendario-repository.interface";

export class PrismaCalendarioRepository implements ICalendarioRepository {
  // =========================================================================
  // Semesters
  // =========================================================================

  findAllSemestres(): Promise<SemestreLetivo[]> {
    return prisma.semestreLetivo.findMany({
      orderBy: { dataInicio: "desc" },
    });
  }

  findSemestreById(id: string): Promise<SemestreLetivoWithEventos | null> {
    return prisma.semestreLetivo.findUnique({
      where: { id },
      include: {
        eventos: {
          orderBy: { dataInicio: "asc" },
        },
      },
    });
  }

  findSemestreAtivo(): Promise<SemestreLetivo | null> {
    const now = new Date();
    return prisma.semestreLetivo.findFirst({
      where: {
        dataInicio: { lte: now },
        dataFim: { gte: now },
      },
    });
  }

  createSemestre(data: CreateSemestreInput): Promise<SemestreLetivo> {
    return prisma.semestreLetivo.create({
      data: {
        nome: data.nome,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
      },
    });
  }

  async updateSemestre(id: string, data: UpdateSemestreInput): Promise<SemestreLetivo | null> {
    const existing = await prisma.semestreLetivo.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) {
      updateData.nome = data.nome;
    }
    if (data.dataInicio !== undefined) {
      updateData.dataInicio = data.dataInicio;
    }
    if (data.dataFim !== undefined) {
      updateData.dataFim = data.dataFim;
    }

    return prisma.semestreLetivo.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteSemestre(id: string): Promise<boolean> {
    const existing = await prisma.semestreLetivo.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }

    await prisma.semestreLetivo.delete({ where: { id } });
    return true;
  }

  // =========================================================================
  // Events
  // =========================================================================

  findEventosBySemestreId(semestreId: string): Promise<EventoCalendario[]> {
    return prisma.eventoCalendario.findMany({
      where: { semestreId },
      orderBy: { dataInicio: "asc" },
    });
  }

  createEvento(data: CreateEventoInput): Promise<EventoCalendario> {
    return prisma.eventoCalendario.create({
      data: {
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        categoria: data.categoria,
        semestreId: data.semestreId,
      },
    });
  }

  async createEventosBatch(data: CreateEventoInput[]): Promise<number> {
    const result = await prisma.eventoCalendario.createMany({
      data: data.map(d => ({
        descricao: d.descricao,
        dataInicio: d.dataInicio,
        dataFim: d.dataFim,
        categoria: d.categoria,
        semestreId: d.semestreId,
      })),
    });
    return result.count;
  }

  async updateEvento(id: string, data: UpdateEventoInput): Promise<EventoCalendario | null> {
    const existing = await prisma.eventoCalendario.findUnique({ where: { id } });
    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {};
    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.dataInicio !== undefined) {
      updateData.dataInicio = data.dataInicio;
    }
    if (data.dataFim !== undefined) {
      updateData.dataFim = data.dataFim;
    }
    if (data.categoria !== undefined) {
      updateData.categoria = data.categoria;
    }

    return prisma.eventoCalendario.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEvento(id: string): Promise<boolean> {
    const existing = await prisma.eventoCalendario.findUnique({ where: { id } });
    if (!existing) {
      return false;
    }

    await prisma.eventoCalendario.delete({ where: { id } });
    return true;
  }

  async deleteEventosBySemestreId(semestreId: string): Promise<number> {
    const result = await prisma.eventoCalendario.deleteMany({
      where: { semestreId },
    });
    return result.count;
  }
}
