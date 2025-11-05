import { Entidade, TipoEntidade } from "../../types";
import { EntidadesDataProvider } from "./entidades-provider.interface";
// import { API_URL, ENDPOINTS } from "../../config/constants";

export class BackendEntidadesProvider implements EntidadesDataProvider {
  // TODO: Implement backend integration
  // async getAll(): Promise<Entidade[]> {
  //   const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADES}`);
  //   if (!response.ok) {
  //     throw new Error("Failed to fetch entidades");
  //   }
  //   const data = await response.json();
  //   // Map backend response to include website property
  //   return data.map((entidade: any) => ({
  //     ...entidade,
  //     website: entidade.website || null,
  //   }));
  // }

  // eslint-disable-next-line require-await
  async getAll(): Promise<Entidade[]> {
    // TODO: Implement backend integration
    throw new Error("Backend provider not implemented yet");
  }

  // TODO: Implement backend integration
  // async getBySlug(slug: string): Promise<Entidade | null> {
  //   const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADE_BY_SLUG(slug)}`);
  //   if (!response.ok) {
  //     if (response.status === 404) {
  //       return null;
  //     }
  //     throw new Error("Failed to fetch entidade");
  //   }
  //   return response.json();
  // }

  // eslint-disable-next-line require-await
  async getBySlug(_slug: string): Promise<Entidade | null> {
    // TODO: Implement backend integration
    throw new Error("Backend provider not implemented yet");
  }

  // TODO: Implement backend integration
  // async getByTipo(tipo: TipoEntidade): Promise<Entidade[]> {
  //   const response = await fetch(`${API_URL}${ENDPOINTS.ENTIDADES}?tipo=${tipo}`);
  //   if (!response.ok) {
  //     throw new Error("Failed to fetch entidades by tipo");
  //   }
  //   return response.json();
  // }

  // eslint-disable-next-line require-await
  async getByTipo(_tipo: TipoEntidade): Promise<Entidade[]> {
    // TODO: Implement backend integration
    throw new Error("Backend provider not implemented yet");
  }
}
