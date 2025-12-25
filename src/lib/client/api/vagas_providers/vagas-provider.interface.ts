import type { Vaga, TipoVaga, EntidadeVaga } from "@/lib/shared/types";

export type VagasDataProvider = {
  /**
   * Retorna todas as vagas disponíveis
   */
  getAll(): Promise<Vaga[]>;

  /**
   * Busca uma vaga pelo id
   */
  getById(id: string): Promise<Vaga | null>;

  /**
   * Filtra vagas pelo tipo
   */
  getByTipo(tipo: TipoVaga): Promise<Vaga[]>;

  /**
   * Filtra vagas baseadas na entidade responsável
   */
  getByEntidade(entidade: EntidadeVaga): Promise<Vaga[]>;
};
