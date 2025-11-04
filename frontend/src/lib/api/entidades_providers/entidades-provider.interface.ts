import { Entidade, TipoEntidade } from "../../types";

export type EntidadesDataProvider = {
  getAll(): Promise<Entidade[]>;
  getBySlug(slug: string): Promise<Entidade | null>;
  getByTipo(tipo: TipoEntidade): Promise<Entidade[]>;
};
