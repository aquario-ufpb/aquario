import { Guia, Secao, SubSecao } from "@/lib/shared/types";
import { GuiasDataProvider } from "./guias_providers/guias-provider.interface";
import { BackendGuiasProvider } from "./guias_providers/backend-guias-provider";
import { LocalFileGuiasProvider } from "./guias_providers/local-file-guias-provider";
import { GUIDAS_DATA_PROVIDER_CONFIG } from "@/lib/shared/config/env";

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
  getAll: async (): Promise<Guia[]> => {
    return await provider.getAll();
  },

  getSecoes: async (guiaSlug: string): Promise<Secao[]> => {
    return await provider.getSecoes(guiaSlug);
  },

  getSubSecoes: async (secaoSlug: string): Promise<SubSecao[]> => {
    return await provider.getSubSecoes(secaoSlug);
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
