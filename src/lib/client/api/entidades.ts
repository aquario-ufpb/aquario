import { Entidade, TipoEntidade } from "@/lib/shared/types";
import { PapelMembro } from "@/lib/shared/types/membro.types";
import { API_URL, ENDPOINTS } from "@/lib/shared/config/constants";

type BackendEntidadeResponse = {
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
      urlFotoPerfil?: string | null;
      curso?: {
        nome: string;
      } | null;
    };
    papel: PapelMembro;
    startedAt?: string;
    endedAt?: string | null;
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
    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADES}`);
    if (!response.ok) {
      throw new Error("Failed to fetch entidades");
    }
    const data: BackendEntidadeResponse[] = await response.json();
    return data.map(entidade => mapBackendToFrontend(entidade));
  },

  getBySlug: async (slug: string): Promise<Entidade | null> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADE_BY_SLUG(slug)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch entidade");
    }
    const data: BackendEntidadeResponse = await response.json();
    // Include membros when fetching by slug (needed for permission checks)
    return mapBackendToFrontend(data, true);
  },

  getByTipo: async (tipo: TipoEntidade): Promise<Entidade[]> => {
    // Fetch all and filter by tipo (backend doesn't have tipo filter endpoint yet)
    const all = await entidadesService.getAll();
    return all.filter(entidade => entidade.tipo === tipo);
  },

  update: async (id: string, data: UpdateEntidadeRequest, token: string): Promise<void> => {
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
      backendData.tipo = data.tipo;
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

  addMember: async (
    entidadeId: string,
    data: {
      usuarioId: string;
      papel: "ADMIN" | "MEMBRO";
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
    startedAt: string;
    endedAt: string | null;
  }> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADE_MEMBROS(entidadeId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Falha ao adicionar membro");
    }

    return response.json();
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

function normalizeTipo(backendTipo: string): TipoEntidade {
  // Validate that the backend tipo is a valid TipoEntidade
  const validTipos: TipoEntidade[] = [
    "LABORATORIO",
    "GRUPO",
    "LIGA_ACADEMICA",
    "CENTRO_ACADEMICO",
    "ATLETICA",
    "EMPRESA",
    "OUTRO",
  ];

  return validTipos.includes(backendTipo as TipoEntidade) ? (backendTipo as TipoEntidade) : "OUTRO";
}

function mapImagePath(urlFoto: string | null | undefined): string {
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

function mapBackendToFrontend(backend: BackendEntidadeResponse, includeMembros = false): Entidade {
  const slug = getEntidadeSlug(backend.nome, backend.slug);

  // Extract order from metadata
  const order =
    backend.metadata && typeof backend.metadata === "object" && "order" in backend.metadata
      ? (backend.metadata.order as number | null)
      : null;

  // Format founding_date if present
  const founding_date = backend.foundingDate
    ? new Date(backend.foundingDate).toISOString().split("T")[0]
    : null;

  return {
    id: backend.id,
    name: backend.nome,
    slug: slug,
    subtitle: backend.subtitle || null,
    description: backend.descricao || null,
    tipo: normalizeTipo(backend.tipo),
    imagePath: mapImagePath(backend.urlFoto),
    contato_email: backend.contato || "",
    instagram: backend.instagram || null,
    linkedin: backend.linkedin || null,
    website: backend.website || null,
    location: backend.location || null,
    founding_date: founding_date,
    order: order,
    membros: includeMembros ? backend.membros : undefined,
    centro: backend.centro || null,
  };
}
