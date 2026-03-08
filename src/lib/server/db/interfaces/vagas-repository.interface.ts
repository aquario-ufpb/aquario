import type { Vaga, TipoVaga, Entidade, Usuario } from "@prisma/client";

export type { Vaga, TipoVaga };

export type VagaWithRelations = Vaga & {
  entidade: Pick<Entidade, "id" | "nome" | "slug" | "tipo" | "urlFoto">;
  criadoPor: Pick<Usuario, "id" | "nome" | "urlFotoPerfil">;
};

export type CreateVagaInput = {
  titulo: string;
  descricao: string;
  tipoVaga: TipoVaga;
  entidadeId: string;
  criadoPorUsuarioId: string;
  linkInscricao: string;
  dataFinalizacao: Date;
  areas?: string[];
  salario?: string | null;
  sobreEmpresa?: string | null;
  responsabilidades?: string[];
  requisitos?: string[];
  informacoesAdicionais?: string | null;
  etapasProcesso?: string[];
};

export type VagasFilter = {
  tipoVaga?: TipoVaga;
  entidadeTipos?: string[];
};

export type IVagasRepository = {
  create(data: CreateVagaInput): Promise<VagaWithRelations>;
  findById(id: string): Promise<VagaWithRelations | null>;
  findManyActive(now?: Date, filter?: VagasFilter): Promise<VagaWithRelations[]>;
  softDelete(id: string): Promise<void>;
};
