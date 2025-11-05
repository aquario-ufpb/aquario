import { Guia, Secao, SubSecao } from "../../types";

export type GuiasDataProvider = {
  getAll(): Promise<Guia[]>;
  getSecoes(guiaSlug: string): Promise<Secao[]>;
  getSubSecoes(secaoSlug: string): Promise<SubSecao[]>;
  getCentros(): Promise<Array<{ id: string; nome: string; sigla: string }>>;
  getCursos(
    centroSigla: string
  ): Promise<Array<{ id: string; nome: string; centroId: string; realId: string }>>;
};
