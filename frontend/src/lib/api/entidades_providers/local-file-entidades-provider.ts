import { Entidade, TipoEntidade } from "../../types";
import { EntidadesDataProvider } from "./entidades-provider.interface";

type EntidadeJson = {
  name: string;
  description?: string;
  tipo: TipoEntidade;
  imagePath: string;
  contato_email: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  people: Array<{
    name: string;
    email: string;
    role: string;
    profession: string;
  }>;
};

// Import all JSON files from the content directory
declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    (id: string): EntidadeJson | { default: EntidadeJson };
  };
};

const contentContext = require.context("../../../../content/aquario-entidades", false, /\.json$/);

export class LocalFileEntidadesProvider implements EntidadesDataProvider {
  private entidadesData: Record<string, EntidadeJson> = {};

  constructor() {
    // Load all JSON files at initialization
    contentContext.keys().forEach((key: string) => {
      const content = contentContext(key) as EntidadeJson | { default: EntidadeJson };
      const jsonData: EntidadeJson =
        "default" in content && content.default ? content.default : (content as EntidadeJson);
      const filename = this.getFilenameFromKey(key);
      const slug = this.filenameToSlug(filename);
      this.entidadesData[slug] = jsonData;
    });
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
      .filter(slug => this.entidadesData[slug].tipo === tipo)
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
      description: data.description || null,
      tipo: data.tipo,
      imagePath: imagePath,
      contato_email: data.contato_email,
      instagram: data.instagram || null,
      linkedin: data.linkedin || null,
      website: data.website || null,
      location: data.location || null,
      people: data.people || [],
    };
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
