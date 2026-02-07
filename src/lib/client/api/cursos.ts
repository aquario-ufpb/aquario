import { Curso } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const cursosService = {
  getByCentro: async (centroId: string): Promise<Curso[]> => {
    const response = await apiClient(ENDPOINTS.CURSOS(centroId), {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  getAll: async (): Promise<Curso[]> => {
    const response = await apiClient(ENDPOINTS.CURSOS_ALL, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  create: async (data: { nome: string; centroId: string }): Promise<Curso> => {
    const response = await apiClient(ENDPOINTS.CURSOS_ALL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  update: async (id: string, data: { nome: string; centroId: string }): Promise<Curso> => {
    const response = await apiClient(ENDPOINTS.CURSO_BY_ID(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiClient(ENDPOINTS.CURSO_BY_ID(id), {
      method: "DELETE",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },
};
