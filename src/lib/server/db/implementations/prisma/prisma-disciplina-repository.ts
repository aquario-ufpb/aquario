import { prisma } from "@/lib/server/db/prisma";
import type {
  IDisciplinaRepository,
  DisciplinaSearchResult,
} from "@/lib/server/db/interfaces/disciplina-repository.interface";

export class PrismaDisciplinaRepository implements IDisciplinaRepository {
  async search(query: string, limit = 20): Promise<DisciplinaSearchResult[]> {
    // Retornamos à busca original e leve, sem carregar os pré-requisitos aqui
    const disciplinas = await prisma.disciplina.findMany({
      where: {
        OR: [
          { codigo: { contains: query, mode: "insensitive" } },
          { nome: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { nome: "asc" },
      select: {
        id: true,
        codigo: true,
        nome: true,
      },
    });

    return disciplinas as DisciplinaSearchResult[];
  }

  findByCodigos(codigos: string[]): Promise<{ id: string; codigo: string }[]> {
    return prisma.disciplina.findMany({
      where: { codigo: { in: codigos } },
      select: { id: true, codigo: true },
    });
  }

  // Novo método focado apenas em resolver a árvore de dependências da cadeira
  async getRelacoes(codigo: string): Promise<{ preRequisitos: string[]; dependentes: string[] }> {
    const disciplina = await prisma.disciplina.findUnique({
      where: { codigo },
      select: {
        // 1. Busca o que a disciplina exige
        curriculos: {
          select: {
            preRequisitos: {
              select: {
                disciplinaRequerida: {
                  select: {
                    codigo: true,
                  },
                },
              },
            },
          },
        },
        // 2. Busca quem exige a disciplina
        preRequisitoEm: {
          select: {
            curriculoDisciplina: {
              select: {
                disciplina: {
                  select: {
                    codigo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!disciplina) {
      return { preRequisitos: [], dependentes: [] };
    }

    const preReqsSet = new Set<string>();
    const dependentesSet = new Set<string>();

    // Mapeia os códigos das disciplinas que SÃO PRÉ-REQUISITOS da cadeira consultada
    disciplina.curriculos.forEach(curriculo => {
      curriculo.preRequisitos.forEach(pr => {
        preReqsSet.add(pr.disciplinaRequerida.codigo);
      });
    });

    // Mapeia os códigos das disciplinas DEPENDENTES da cadeira consultada
    disciplina.preRequisitoEm.forEach(pr => {
      dependentesSet.add(pr.curriculoDisciplina.disciplina.codigo);
    });

    return {
      preRequisitos: Array.from(preReqsSet),
      dependentes: Array.from(dependentesSet),
    };
  }
}
