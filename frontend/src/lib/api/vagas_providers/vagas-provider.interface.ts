import { Vaga, TipoVaga, EntidadeVaga } from "../../../components/pages/vagas/vacancy-card";

export interface VagasDataProvider {
  /**
   * Retorna todas as vagas disponíveis.
   */
  getAll(): Promise<Vaga[]>;

  /**
   * Busca uma vaga pelo slug (derivado do nome do arquivo JSON).
   */
  getById(id: string): Promise<Vaga | null>;

  /**
   * Filtra vagas pelo tipo (ESTAGIO, CLT, etc).
   */
  getByTipo(tipo: TipoVaga): Promise<Vaga[]>;

  /**
   * Filtra vagas baseadas na entidade responsável (laboratorios, grupos, ufpb, etc).
   */
  getByEntidade(entidade: EntidadeVaga): Promise<Vaga[]>;
}
