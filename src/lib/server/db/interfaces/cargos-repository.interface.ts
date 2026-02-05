export type Cargo = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  entidadeId: string;
};

export type CreateCargoInput = {
  nome: string;
  descricao?: string | null;
  ordem?: number;
  entidadeId: string;
};

export type UpdateCargoInput = {
  nome?: string;
  descricao?: string | null;
  ordem?: number;
};

export type ICargosRepository = {
  findByEntidadeId(entidadeId: string): Promise<Cargo[]>;
  findById(id: string): Promise<Cargo | null>;
  findByIdAndEntidade(cargoId: string, entidadeId: string): Promise<Cargo | null>;
  create(data: CreateCargoInput): Promise<Cargo>;
  update(id: string, data: UpdateCargoInput): Promise<Cargo>;
  delete(id: string): Promise<void>;
};
