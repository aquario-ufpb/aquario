import { Entidade, TipoEntidade } from "../types";
import { EntidadesDataProvider } from "./entidades_providers/entidades-provider.interface";
import { BackendEntidadesProvider } from "./entidades_providers/backend-entidades-provider";
import { LocalFileEntidadesProvider } from "./entidades_providers/local-file-entidades-provider";
import { DATA_PROVIDER_CONFIG } from "../config/env";

// Provider factory
function createProvider(): EntidadesDataProvider {
  switch (DATA_PROVIDER_CONFIG.PROVIDER) {
    case DATA_PROVIDER_CONFIG.PROVIDERS.LOCAL:
      return new LocalFileEntidadesProvider();
    case DATA_PROVIDER_CONFIG.PROVIDERS.BACKEND:
    default:
      return new BackendEntidadesProvider();
  }
}

const provider = createProvider();

export const entidadesService = {
  getAll: async (): Promise<Entidade[]> => {
    return await provider.getAll();
  },

  getBySlug: async (slug: string): Promise<Entidade | null> => {
    return await provider.getBySlug(slug);
  },

  getByTipo: async (tipo: TipoEntidade): Promise<Entidade[]> => {
    return await provider.getByTipo(tipo);
  },
};
