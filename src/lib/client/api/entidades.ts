import { Entidade, TipoEntidade } from "@/lib/shared/types";
import { PapelMembro } from "@/lib/shared/types/membro.types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

type ApiEntidadeResponse = {
  id: string;
  nome: string;
  slug?: string | null;
  subtitle?: string | null;
  descricao?: string | null;
  tipo: string;
  urlFoto?: string | null;
  contato?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  foundingDate?: string | null;
  metadata?: Record<string, unknown> | null;
  centroId: string;
  centro?: {
    id: string;
    nome: string;
    sigla: string;
  } | null;
  membros?: Array<{
    id: string;
    usuario: {
      id: string;
      nome: string;
      slug?: string | null;
      urlFotoPerfil?: string | null;
      eFacade?: boolean;
      curso?: {
        nome: string;
      } | null;
    };
    papel: PapelMembro;
    cargo?: {
      id: string;
      nome: string;
      descricao?: string | null;
      ordem: number;
    } | null;
    startedAt?: string;
    endedAt?: string | null;
  }>;
  cargos?: Array<{
    id: string;
    nome: string;
    descricao?: string | null;
    ordem: number;
    entidadeId: string;
  }>;
};

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
  slug?: string; // Custom slug
};

export const entidadesService = {
  getAll: async (): Promise<Entidade[]> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADES}`, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    const data: ApiEntidadeResponse[] = await response.json();
    return data.map(entidade => mapApiResponseToEntidade(entidade));
  },

  getBySlug: async (slug: string): Promise<Entidade | null> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_BY_SLUG(slug)}`, {
      method: "GET",
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      await throwApiError(response);
    }
    const data: ApiEntidadeResponse = await response.json();
    // Include membros when fetching by slug (needed for permission checks)
    return mapApiResponseToEntidade(data, true);
  },

  getByTipo: async (tipo: TipoEntidade): Promise<Entidade[]> => {
    // Fetch all and filter by tipo (API doesn't have tipo filter endpoint yet)
    const all = await entidadesService.getAll();
    return all.filter(entidade => entidade.tipo === tipo);
  },

  update: async (id: string, data: UpdateEntidadeRequest, token: string): Promise<void> => {
    // Map frontend fields to API fields
    const requestData: Record<string, unknown> = {};
    if (data.nome !== undefined) {
      requestData.nome = data.nome;
    }
    if (data.subtitle !== undefined) {
      requestData.subtitle = data.subtitle;
    }
    if (data.description !== undefined) {
      requestData.descricao = data.description;
    }
    if (data.tipo !== undefined) {
      requestData.tipo = data.tipo;
    }
    if (data.imagePath !== undefined) {
      if (data.imagePath) {
        // Extract filename from imagePath if it's a full path
        const imageMatch = data.imagePath.match(/assets\/entidades\/(.+)$/);
        requestData.urlFoto = imageMatch ? imageMatch[1] : data.imagePath;
      } else {
        requestData.urlFoto = null;
      }
    }
    if (data.contato_email !== undefined) {
      requestData.contato = data.contato_email;
    }
    if (data.instagram !== undefined) {
      requestData.instagram = data.instagram;
    }
    if (data.linkedin !== undefined) {
      requestData.linkedin = data.linkedin;
    }
    if (data.website !== undefined) {
      requestData.website = data.website;
    }
    if (data.location !== undefined) {
      requestData.location = data.location;
    }
    if (data.founding_date !== undefined) {
      requestData.foundingDate = data.founding_date
        ? new Date(data.founding_date).toISOString()
        : null;
    }
    if (data.slug !== undefined) {
      requestData.slug = data.slug;
    }

    const response = await apiClient(`${ENDPOINTS.ENTIDADE_BY_ID(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      await throwApiError(response);
    }
  },

  addMember: async (
    entidadeId: string,
    data: {
      usuarioId: string;
      papel: "ADMIN" | "MEMBRO";
      cargoId?: string | null;
      startedAt?: string;
      endedAt?: string | null;
    },
    token: string
  ): Promise<{
    id: string;
    usuario: {
      id: string;
      nome: string;
      urlFotoPerfil?: string | null;
      curso?: { nome: string } | null;
    };
    papel: "ADMIN" | "MEMBRO";
    cargo?: {
      id: string;
      nome: string;
      descricao?: string | null;
      ordem: number;
    } | null;
    startedAt: string;
    endedAt: string | null;
  }> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_MEMBROS(entidadeId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  updateMember: async (
    entidadeId: string,
    membroId: string,
    data: {
      papel?: "ADMIN" | "MEMBRO";
      cargoId?: string | null;
      startedAt?: string;
      endedAt?: string | null;
    },
    token: string
  ): Promise<{
    id: string;
    usuario: {
      id: string;
      nome: string;
      urlFotoPerfil?: string | null;
      curso?: { nome: string } | null;
    };
    papel: "ADMIN" | "MEMBRO";
    cargo?: {
      id: string;
      nome: string;
      descricao?: string | null;
      ordem: number;
    } | null;
    startedAt: string;
    endedAt: string | null;
  }> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_MEMBRO(entidadeId, membroId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  deleteMember: async (entidadeId: string, membroId: string, token: string): Promise<void> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_MEMBRO(entidadeId, membroId)}`, {
      method: "DELETE",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }
  },

  // Cargo management
  getCargos: async (
    entidadeId: string
  ): Promise<
    Array<{
      id: string;
      nome: string;
      descricao?: string | null;
      ordem: number;
      entidadeId: string;
    }>
  > => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_CARGOS(entidadeId)}`, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  createCargo: async (
    entidadeId: string,
    data: {
      nome: string;
      descricao?: string | null;
      ordem?: number;
    },
    token: string
  ): Promise<{
    id: string;
    nome: string;
    descricao?: string | null;
    ordem: number;
    entidadeId: string;
  }> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_CARGOS(entidadeId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  updateCargo: async (
    entidadeId: string,
    cargoId: string,
    data: {
      nome?: string;
      descricao?: string | null;
      ordem?: number;
    },
    token: string
  ): Promise<{
    id: string;
    nome: string;
    descricao?: string | null;
    ordem: number;
    entidadeId: string;
  }> => {
    const response = await apiClient(`${ENDPOINTS.ENTIDADE_CARGOS(entidadeId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify({ cargoId, ...data }),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  deleteCargo: async (entidadeId: string, cargoId: string, token: string): Promise<void> => {
    const response = await apiClient(
      `${ENDPOINTS.ENTIDADE_CARGOS(entidadeId)}?cargoId=${cargoId}`,
      {
        method: "DELETE",
        token,
      }
    );

    if (!response.ok) {
      await throwApiError(response);
    }
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function nomeToSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

function normalizeTipo(apiTipo: string): TipoEntidade {
  // Validate that the API tipo is a valid TipoEntidade
  const validTipos: TipoEntidade[] = [
    "LABORATORIO",
    "GRUPO",
    "LIGA_ACADEMICA",
    "CENTRO_ACADEMICO",
    "ATLETICA",
    "EMPRESA",
    "OUTRO",
  ];

  return validTipos.includes(apiTipo as TipoEntidade) ? (apiTipo as TipoEntidade) : "OUTRO";
}

export function mapImagePath(urlFoto: string | null | undefined): string {
  if (!urlFoto) {
    return "/api/content-images/assets/entidades/default.png";
  }

  // If it's already a full path, return as is
  if (urlFoto.startsWith("/") || urlFoto.startsWith("http")) {
    return urlFoto;
  }

  // Convert filename to API route
  return `/api/content-images/assets/entidades/${urlFoto}`;
}

function getEntidadeSlug(nome: string, slug: string | null | undefined): string {
  // Use slug column if available
  if (slug && slug.trim()) {
    return slug.trim();
  }
  // Fallback to generating from nome
  return nomeToSlug(nome);
}

function mapApiResponseToEntidade(apiData: ApiEntidadeResponse, includeMembros = false): Entidade {
  const slug = getEntidadeSlug(apiData.nome, apiData.slug);

  // Extract order from metadata
  const order =
    apiData.metadata && typeof apiData.metadata === "object" && "order" in apiData.metadata
      ? (apiData.metadata.order as number | null)
      : null;

  // Format founding_date if present
  const founding_date = apiData.foundingDate
    ? new Date(apiData.foundingDate).toISOString().split("T")[0]
    : null;

  return {
    id: apiData.id,
    name: apiData.nome,
    slug: slug,
    subtitle: apiData.subtitle || null,
    description: apiData.descricao || null,
    tipo: normalizeTipo(apiData.tipo),
    imagePath: mapImagePath(apiData.urlFoto),
    contato_email: apiData.contato || "",
    instagram: apiData.instagram || null,
    linkedin: apiData.linkedin || null,
    website: apiData.website || null,
    location: apiData.location || null,
    founding_date: founding_date,
    order: order,
    membros: includeMembros
      ? apiData.membros?.map(membro => ({
          ...membro,
          cargo: membro.cargo
            ? {
                ...membro.cargo,
                entidadeId: apiData.id,
              }
            : null,
        }))
      : undefined,
    cargos: apiData.cargos?.map(cargo => ({
      ...cargo,
      entidadeId: apiData.id,
    })),
    centro: apiData.centro || null,
  };
}
