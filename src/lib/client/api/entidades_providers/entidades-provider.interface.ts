import { Entidade, TipoEntidade } from "@/lib/shared/types";

export type EntidadesDataProvider = {
  getAll(): Promise<Entidade[]>;
  getBySlug(slug: string): Promise<Entidade | null>;
  getByTipo(tipo: TipoEntidade): Promise<Entidade[]>;
};
