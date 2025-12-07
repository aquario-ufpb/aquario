import { Entidade, TipoEntidade } from "../types";
import { EntidadesDataProvider } from "./entidades_providers/entidades-provider.interface";
import { BackendEntidadesProvider } from "./entidades_providers/backend-entidades-provider";
import { LocalFileEntidadesProvider } from "./entidades_providers/local-file-entidades-provider";
import { ENTIDADES_DATA_PROVIDER_CONFIG } from "../config/env";

// Provider factory
function createProvider(): EntidadesDataProvider {
  switch (ENTIDADES_DATA_PROVIDER_CONFIG.PROVIDER) {
    case ENTIDADES_DATA_PROVIDER_CONFIG.PROVIDERS.LOCAL:
      return new LocalFileEntidadesProvider();
    case ENTIDADES_DATA_PROVIDER_CONFIG.PROVIDERS.BACKEND:
    default:
      return new BackendEntidadesProvider();
  }
}

const provider = createProvider();

export type UpdateEntidadeRequest = {
  nome?: string;
  subtitle?: string | null;
  description?: string | null;
  tipo?: TipoEntidade;
  imagePath?: string | null;
  contato_email?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  founding_date?: string | null; // ISO date string
  slug?: string; // Custom slug (stored in metadata)
};

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

  update: async (id: string, data: UpdateEntidadeRequest, token: string): Promise<void> => {
    const { API_URL, ENDPOINTS } = await import("../config/constants");

    // Map frontend fields to backend fields
    const backendData: Record<string, unknown> = {};
    if (data.nome !== undefined) {
      backendData.nome = data.nome;
    }
    if (data.subtitle !== undefined) {
      backendData.subtitle = data.subtitle;
    }
    if (data.description !== undefined) {
      backendData.descricao = data.description;
    }
    if (data.tipo !== undefined) {
      // Map frontend tipo to backend tipo
      const tipoMap: Record<TipoEntidade, string> = {
        LABORATORIO: "LABORATORIO",
        GRUPO_ESTUDANTIL: "GRUPO",
        LIGA_ESTUDANTIL: "LIGA_ACADEMICA",
        CENTRO_ACADEMICO: "CENTRO_ACADEMICO",
        ATLETICA: "ATLETICA",
        EMPRESA: "EMPRESA",
        OUTRO: "OUTRO",
      };
      backendData.tipo = tipoMap[data.tipo] || data.tipo;
    }
    if (data.imagePath !== undefined) {
      if (data.imagePath) {
        // Extract filename from imagePath if it's a full path
        const imageMatch = data.imagePath.match(/assets\/entidades\/(.+)$/);
        backendData.urlFoto = imageMatch ? imageMatch[1] : data.imagePath;
      } else {
        backendData.urlFoto = null;
      }
    }
    if (data.contato_email !== undefined) {
      backendData.contato = data.contato_email;
    }
    if (data.instagram !== undefined) {
      backendData.instagram = data.instagram;
    }
    if (data.linkedin !== undefined) {
      backendData.linkedin = data.linkedin;
    }
    if (data.website !== undefined) {
      backendData.website = data.website;
    }
    if (data.location !== undefined) {
      backendData.location = data.location;
    }
    if (data.founding_date !== undefined) {
      backendData.foundingDate = data.founding_date
        ? new Date(data.founding_date).toISOString()
        : null;
    }
    if (data.slug !== undefined) {
      backendData.slug = data.slug;
    }

    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADE_BY_ID(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Falha ao atualizar entidade");
    }
  },
};
