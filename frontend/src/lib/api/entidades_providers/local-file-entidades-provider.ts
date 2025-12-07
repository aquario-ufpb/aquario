import { Entidade, TipoEntidade } from "../../types";
import { EntidadesDataProvider } from "./entidades-provider.interface";

type EntidadeJson = {
  name: string;
  subtitle?: string;
  description?: string;
  tipo: string; // accept legacy and new values, normalize later
  imagePath: string;
  contato_email: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  founding_date?: string;
  order?: number;
  people: Array<{
    name: string;
    email: string;
    role: string;
    profession: string;
  }>;
};

// Import all JSON files from the content directory
declare const require: {
  context?(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    (id: string): EntidadeJson | { default: EntidadeJson };
  };
};

// Helper to safely get require.context (only available in webpack/browser environments)
function getContentContext() {
  if (typeof require !== "undefined" && require.context) {
    return require.context("../../../../content/aquario-entidades", true, /\.json$/);
  }
  return null;
}

const contentContext = getContentContext();

export class LocalFileEntidadesProvider implements EntidadesDataProvider {
  private entidadesData: Record<string, EntidadeJson> = {};

  constructor() {
    // Only load files if require.context is available (webpack/browser environment)
    // In test environments, this will be skipped and content can be injected via mocks
    if (contentContext) {
      // Load all JSON files at initialization, filtering for centro-de-informatica only
      contentContext.keys().forEach((key: string) => {
        // Only process files from centro-de-informatica folder
        if (!key.includes("/centro-de-informatica/")) {
          return;
        }

        const content = contentContext(key) as EntidadeJson | { default: EntidadeJson };
        const jsonData: EntidadeJson =
          "default" in content && content.default ? content.default : (content as EntidadeJson);
        const filename = this.getFilenameFromKey(key);
        const slug = this.filenameToSlug(filename);
        this.entidadesData[slug] = jsonData;
      });
    }
  }

  getAll(): Promise<Entidade[]> {
    const entidades: Entidade[] = Object.keys(this.entidadesData).map(slug => {
      const data = this.entidadesData[slug];
      return this.jsonToEntidade(data, slug);
    });

    return Promise.resolve(entidades);
  }

  getBySlug(slug: string): Promise<Entidade | null> {
    const data = this.entidadesData[slug];
    if (!data) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.jsonToEntidade(data, slug));
  }

  getByTipo(tipo: TipoEntidade): Promise<Entidade[]> {
    const entidades: Entidade[] = Object.keys(this.entidadesData)
      .filter(slug => this.normalizeTipo(this.entidadesData[slug].tipo) === tipo)
      .map(slug => {
        const data = this.entidadesData[slug];
        return this.jsonToEntidade(data, slug);
      });

    return Promise.resolve(entidades);
  }

  private jsonToEntidade(data: EntidadeJson, slug: string): Entidade {
    // Transform image path to API route
    // Handles both relative paths (./assets/Compilada.png or assets/Compilada.png)
    // and absolute paths (/assets/entidades/Compilada.png)
    let imagePath = data.imagePath;

    // Remove leading ./ if present
    if (imagePath.startsWith("./")) {
      imagePath = imagePath.substring(2);
    }

    // Handle relative paths (assets/Compilada.png) - relative to JSON file location
    if (imagePath.startsWith("assets/")) {
      // Convert to API route: assets/Compilada.png -> /api/content-images/assets/entidades/Compilada.png
      imagePath = `/api/content-images/assets/entidades/${imagePath.substring(7)}`; // Remove "assets/" prefix
    }
    // Handle absolute paths (/assets/entidades/...)
    else if (imagePath.startsWith("/assets/entidades/")) {
      imagePath = imagePath.replace("/assets/entidades/", "/api/content-images/assets/entidades/");
    }

    return {
      id: `entidade-${slug}`,
      name: data.name,
      slug: slug,
      subtitle: data.subtitle || null,
      description: data.description || null,
      tipo: this.normalizeTipo(data.tipo),
      imagePath: imagePath,
      contato_email: data.contato_email,
      instagram: data.instagram || null,
      linkedin: data.linkedin || null,
      website: data.website || null,
      location: data.location || null,
      founding_date: data.founding_date || null,
      people: data.people || [],
      order: data.order || null,
    };
  }

  private normalizeTipo(value: string): TipoEntidade {
    const v = (value || "").toUpperCase().replace(/\s+/g, "_");
    // Map legacy values to new canonical set
    switch (v) {
      case "LABORATORIO":
        return "LABORATORIO";
      case "GRUPO_PESQUISA":
        return "GRUPO_ESTUDANTIL";
      case "LIGA_ACADEMICA":
        return "LIGA_ESTUDANTIL";
      case "OUTRO":
        return "OUTRO";
      case "CENTROS_ACADEMICOS":
        return "CENTRO_ACADEMICO";
      case "ATLETICAS":
        return "ATLETICA";
      case "LIGAS_ESTUDANTIS":
        return "LIGA_ESTUDANTIL";
      case "GRUPOS_ESTUDANTIS":
        return "GRUPO_ESTUDANTIL";
      case "OUTROS":
        return "OUTRO";
      case "EMPRESAS":
        return "EMPRESA";
      case "CENTRO_ACADEMICO":
      case "ATLETICA":
      case "LIGA_ESTUDANTIL":
      case "GRUPO_ESTUDANTIL":
      case "EMPRESA":
        return v as TipoEntidade;
      default:
        return "OUTRO";
    }
  }

  private getFilenameFromKey(key: string): string {
    // Extract filename from key like "./laser.json" -> "laser.json"
    const parts = key.split("/");
    return parts[parts.length - 1];
  }

  /**
   * Converts a filename to a URL-friendly slug
   * Examples:
   *   "laser.json" -> "laser"
   *   "grupo-pesquisa-ai.json" -> "grupo-pesquisa-ai"
   */
  private filenameToSlug(filename: string): string {
    return filename.replace(/\.json$/, "");
  }
}
