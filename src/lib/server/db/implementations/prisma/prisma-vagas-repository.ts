import { prisma } from "@/lib/server/db/prisma";
import type {
  IVagasRepository,
  VagaWithRelations,
  CreateVagaInput,
} from "@/lib/server/db/interfaces/vagas-repository.interface";

const vagaInclude = {
  entidade: {
    select: { id: true, nome: true, slug: true, tipo: true, urlFoto: true },
  },
  criadoPor: {
    select: { id: true, nome: true, urlFotoPerfil: true },
  },
} as const;

export class PrismaVagasRepository implements IVagasRepository {
  async create(data: CreateVagaInput): Promise<VagaWithRelations> {
    const vaga = await prisma.vaga.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipoVaga: data.tipoVaga,
        entidadeId: data.entidadeId,
        criadoPorUsuarioId: data.criadoPorUsuarioId,
        linkInscricao: data.linkInscricao,
        dataFinalizacao: data.dataFinalizacao,
        areas: data.areas ?? [],
        salario: data.salario ?? null,
        sobreEmpresa: data.sobreEmpresa ?? null,
        responsabilidades: data.responsabilidades ?? [],
        requisitos: data.requisitos ?? [],
        informacoesAdicionais: data.informacoesAdicionais ?? null,
        etapasProcesso: data.etapasProcesso ?? [],
      },
      include: vagaInclude,
    });
    return vaga as unknown as VagaWithRelations;
  }

  async findById(id: string): Promise<VagaWithRelations | null> {
    const vaga = await prisma.vaga.findFirst({
      where: { id, deletadoEm: null },
      include: vagaInclude,
    });
    return (vaga as unknown as VagaWithRelations) ?? null;
  }

  async findManyActive(now: Date = new Date()): Promise<VagaWithRelations[]> {
    const vagas = await prisma.vaga.findMany({
      where: {
        deletadoEm: null,
        dataFinalizacao: { gte: now },
      },
      include: vagaInclude,
      orderBy: { criadoEm: "desc" },
    });
    return vagas as unknown as VagaWithRelations[];
  }

  async softDelete(id: string): Promise<void> {
    await prisma.vaga.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  }
}
