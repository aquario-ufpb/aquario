import type { PapelMembro } from "@prisma/client";

export type MembroWithRelations = {
  id: string;
  usuarioId: string;
  entidadeId: string;
  papel: PapelMembro;
  cargoId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  usuario: {
    id: string;
    nome: string;
    slug: string | null;
    urlFotoPerfil: string | null;
    eFacade: boolean;
    curso: { nome: string } | null;
  };
  cargo: {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
  } | null;
};

export type MembroWithEntidade = {
  id: string;
  papel: PapelMembro;
  startedAt: Date;
  endedAt: Date | null;
  entidade: {
    id: string;
    nome: string;
    slug: string | null;
    tipo: string;
    urlFoto: string | null;
    centro: {
      id: string;
      nome: string;
      sigla: string;
    };
  };
  cargo: {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
  } | null;
};

export type CreateMembroInput = {
  usuarioId: string;
  entidadeId: string;
  papel: PapelMembro;
  cargoId?: string | null;
  startedAt?: Date;
  endedAt?: Date | null;
};

export type UpdateMembroInput = {
  papel?: PapelMembro;
  cargoId?: string | null;
  startedAt?: Date;
  endedAt?: Date | null;
};

export type MembroRaw = {
  id: string;
  usuarioId: string;
  entidadeId: string;
  papel: PapelMembro;
  cargoId: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

export type IMembrosRepository = {
  create(data: CreateMembroInput): Promise<MembroWithRelations>;
  findById(id: string): Promise<MembroWithRelations | null>;
  findByEntidadeAndMembro(
    entidadeId: string,
    membroId: string
  ): Promise<MembroWithRelations | null>;
  findActiveByUsuarioAndEntidade(
    usuarioId: string,
    entidadeId: string
  ): Promise<MembroWithRelations | null>;
  findByUsuarioId(usuarioId: string): Promise<MembroWithEntidade[]>;
  findRawByUsuarioId(usuarioId: string): Promise<MembroRaw[]>;
  update(id: string, data: UpdateMembroInput): Promise<MembroWithRelations>;
  delete(id: string): Promise<void>;
  deleteByUsuarioId(usuarioId: string): Promise<number>;
  usuarioExists(usuarioId: string): Promise<boolean>;
  cargoExistsInEntidade(cargoId: string, entidadeId: string): Promise<boolean>;
};
