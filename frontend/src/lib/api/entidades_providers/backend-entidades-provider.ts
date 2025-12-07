import { Entidade, TipoEntidade } from "../../types";
import { EntidadesDataProvider } from "./entidades-provider.interface";
import { API_URL, ENDPOINTS } from "../../config/constants";

type BackendEntidadeResponse = {
  id: string;
  nome: string;
  subtitle?: string | null;
  descricao?: string | null;
  tipo: string;
  urlFoto?: string | null;
  contato?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  foundingDate?: string | null; // ISO date string from backend
  metadata?: Record<string, unknown> | null;
  centroId: string;
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
    papel: string;
  }>;
};

export class BackendEntidadesProvider implements EntidadesDataProvider {
  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }

  private normalizeTipo(backendTipo: string): TipoEntidade {
    // Map backend enum values to frontend types
    const tipoMap: Record<string, TipoEntidade> = {
      LABORATORIO: "LABORATORIO",
      GRUPO: "GRUPO_ESTUDANTIL", // Backend uses GRUPO, frontend expects GRUPO_ESTUDANTIL
      LIGA_ACADEMICA: "LIGA_ESTUDANTIL", // Backend uses LIGA_ACADEMICA, frontend expects LIGA_ESTUDANTIL
      CENTRO_ACADEMICO: "CENTRO_ACADEMICO",
      ATLETICA: "ATLETICA",
      EMPRESA: "EMPRESA",
      OUTRO: "OUTRO",
    };

    return tipoMap[backendTipo] || "OUTRO";
  }

  private mapImagePath(urlFoto: string | null | undefined): string {
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

  private mapBackendToFrontend(backend: BackendEntidadeResponse): Entidade {
    const slug = this.nomeToSlug(backend.nome);

    // Map membros to people format
    const people = (backend.membros || []).map(membro => ({
      name: membro.usuario.nome,
      email: "", // Backend doesn't expose email
      role: membro.papel,
      profession: membro.usuario.curso?.nome || "",
    }));

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
      tipo: this.normalizeTipo(backend.tipo),
      imagePath: this.mapImagePath(backend.urlFoto),
      contato_email: backend.contato || "",
      instagram: backend.instagram || null,
      linkedin: backend.linkedin || null,
      website: backend.website || null,
      location: backend.location || null,
      founding_date: founding_date,
      people: people,
      order: order,
    };
  }

  async getAll(): Promise<Entidade[]> {
    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADES}`);
    if (!response.ok) {
      throw new Error("Failed to fetch entidades");
    }
    const data: BackendEntidadeResponse[] = await response.json();
    return data.map(entidade => this.mapBackendToFrontend(entidade));
  }

  async getBySlug(slug: string): Promise<Entidade | null> {
    const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADE_BY_SLUG(slug)}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch entidade");
    }
    const data: BackendEntidadeResponse = await response.json();
    return this.mapBackendToFrontend(data);
  }

  async getByTipo(tipo: TipoEntidade): Promise<Entidade[]> {
    // Fetch all and filter by tipo (backend doesn't have tipo filter endpoint yet)
    const all = await this.getAll();
    return all.filter(entidade => entidade.tipo === tipo);
  }
}
