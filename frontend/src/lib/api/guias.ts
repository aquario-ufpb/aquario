import { Guia, Secao, SubSecao } from "../types";
import { GuiasDataProvider } from "./guias_providers/guias-provider.interface";
import { BackendGuiasProvider } from "./guias_providers/backend-guias-provider";
import { LocalFileGuiasProvider } from "./guias_providers/local-file-guias-provider";
import { GUIDAS_DATA_PROVIDER_CONFIG } from "../config/env";

// Provider factory
function createProvider(): GuiasDataProvider {
  switch (GUIDAS_DATA_PROVIDER_CONFIG.PROVIDER) {
    case GUIDAS_DATA_PROVIDER_CONFIG.PROVIDERS.LOCAL:
      return new LocalFileGuiasProvider();
    case GUIDAS_DATA_PROVIDER_CONFIG.PROVIDERS.BACKEND:
    default:
      return new BackendGuiasProvider();
  }
}

const provider = createProvider();

export const guiasService = {
  getByCurso: async (cursoSlug: string): Promise<Guia[]> => {
    return await provider.getByCurso(cursoSlug);
  },

  getSecoes: async (guiaSlug: string, cursoSlug?: string): Promise<Secao[]> => {
    return await provider.getSecoes(guiaSlug, cursoSlug);
  },

  getSubSecoes: async (secaoSlug: string, cursoSlug?: string): Promise<SubSecao[]> => {
    return await provider.getSubSecoes(secaoSlug, cursoSlug);
  },

  getCentros: async (): Promise<Array<{ id: string; nome: string; sigla: string }>> => {
    return await provider.getCentros();
  },

  getCursos: async (
    centroSigla: string
  ): Promise<Array<{ id: string; nome: string; centroId: string }>> => {
    return await provider.getCursos(centroSigla);
  },
};
