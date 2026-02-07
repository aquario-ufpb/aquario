import { prisma } from "@/lib/server/db/prisma";
import type { ICurriculosRepository } from "@/lib/server/db/interfaces/curriculos-repository.interface";
import type { GradeCurricularResponse, GradeDisciplinaNode } from "@/lib/shared/types";

export class PrismaCurriculosRepository implements ICurriculosRepository {
  async findActiveGradeByCursoId(cursoId: string): Promise<GradeCurricularResponse | null> {
    const curriculo = await prisma.curriculo.findFirst({
      where: { cursoId, ativo: true },
      include: {
        curso: { select: { nome: true } },
        disciplinas: {
          include: {
            disciplina: {
              include: {
                equivalenciasOrigem: {
                  include: {
                    disciplinaEquivalente: { select: { codigo: true } },
                  },
                },
              },
            },
            preRequisitos: {
              include: {
                disciplinaRequerida: { select: { codigo: true } },
              },
            },
          },
          orderBy: [{ periodo: "asc" }, { natureza: "asc" }],
        },
      },
    });

    if (!curriculo) {
      return null;
    }

    const disciplinas: GradeDisciplinaNode[] = curriculo.disciplinas.map(cd => ({
      id: cd.id,
      disciplinaId: cd.disciplinaId,
      codigo: cd.disciplina.codigo,
      nome: cd.disciplina.nome,
      periodo: cd.periodo,
      natureza: cd.natureza,
      cargaHorariaTotal: cd.disciplina.cargaHorariaTotal,
      cargaHorariaTeoria: cd.disciplina.cargaHorariaTeoria,
      cargaHorariaPratica: cd.disciplina.cargaHorariaPratica,
      departamento: cd.disciplina.departamento,
      modalidade: cd.disciplina.modalidade,
      ementa: cd.disciplina.ementa,
      preRequisitos: cd.preRequisitos.map(pr => pr.disciplinaRequerida.codigo),
      equivalencias: cd.disciplina.equivalenciasOrigem.map(eq => eq.disciplinaEquivalente.codigo),
    }));

    return {
      curriculoId: curriculo.id,
      curriculoCodigo: curriculo.codigo,
      cursoId,
      cursoNome: curriculo.curso.nome,
      disciplinas,
    };
  }
}
