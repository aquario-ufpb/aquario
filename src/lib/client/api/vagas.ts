import { Vaga, TipoVaga, EntidadeVaga } from "@/components/pages/vagas/vacancy-card";
import { VagasDataProvider } from "./vagas_providers/vagas-provider.interface";
import { LocalFileVagasProvider } from "./vagas_providers/local-file-vagas-provider";

const provider: VagasDataProvider = new LocalFileVagasProvider();

export const vagasService = {
  getAll: async (): Promise<Vaga[]> => {
    return await provider.getAll();
  },

  getById: async (id: string): Promise<Vaga | null> => {
    return await provider.getById(id);
  },

  getByTipo: async (tipo: TipoVaga): Promise<Vaga[]> => {
    return await provider.getByTipo(tipo);
  },

  getByEntidade: async (entidade: EntidadeVaga): Promise<Vaga[]> => {
    return await provider.getByEntidade(entidade);
  },
};
