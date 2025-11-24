/**
 * Mock for LocalFileEntidadesProvider used in tests
 * Bypasses require.context and uses injectable content
 */

import { Entidade, TipoEntidade } from "../../../types";
import { EntidadesDataProvider } from "../entidades-provider.interface";

type EntidadeJson = {
  name: string;
  subtitle?: string;
  description?: string;
  tipo: string;
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

export class LocalFileEntidadesProvider implements EntidadesDataProvider {
  public entidadesData: Record<string, EntidadeJson> = {};

  constructor() {
    // No require.context in tests - content will be injected
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
    let imagePath = data.imagePath;

    // Remove leading ./ if present
    if (imagePath.startsWith("./")) {
      imagePath = imagePath.substring(2);
    }

    // Handle relative paths (assets/Compilada.png) - relative to JSON file location
    if (imagePath.startsWith("assets/")) {
      imagePath = `/api/content-images/assets/entidades/${imagePath.substring(7)}`;
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
}
