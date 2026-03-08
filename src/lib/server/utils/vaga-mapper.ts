import type { VagaWithRelations } from "@/lib/server/db/interfaces/vagas-repository.interface";

export function mapVagaToJson(vaga: VagaWithRelations) {
  return {
    id: vaga.id,
    titulo: vaga.titulo,
    descricao: vaga.descricao,
    tipoVaga: vaga.tipoVaga,
    areas: vaga.areas,
    criadoEm: vaga.criadoEm.toISOString(),
    dataFinalizacao: vaga.dataFinalizacao.toISOString(),
    linkInscricao: vaga.linkInscricao,
    salario: vaga.salario ?? undefined,
    sobreEmpresa: vaga.sobreEmpresa ?? undefined,
    responsabilidades: vaga.responsabilidades,
    requisitos: vaga.requisitos,
    informacoesAdicionais: vaga.informacoesAdicionais ?? undefined,
    etapasProcesso: vaga.etapasProcesso,
    entidade: {
      id: vaga.entidade.id,
      nome: vaga.entidade.nome,
      slug: vaga.entidade.slug ?? undefined,
      tipo: vaga.entidade.tipo,
      urlFoto: vaga.entidade.urlFoto ?? undefined,
    },
    publicador: {
      nome: vaga.criadoPor.nome,
      urlFotoPerfil: vaga.criadoPor.urlFotoPerfil ?? undefined,
    },
  };
}
