import { Centro } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const centrosService = {
  getAll: async (): Promise<Centro[]> => {
    const response = await apiClient(ENDPOINTS.CENTROS, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  create: async (data: {
    nome: string;
    sigla: string;
    descricao: string | null;
    campusId: string;
  }): Promise<Centro> => {
    const response = await apiClient(ENDPOINTS.CENTROS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  update: async (
    id: string,
    data: { nome: string; sigla: string; descricao: string | null; campusId?: string }
  ): Promise<Centro> => {
    const response = await apiClient(ENDPOINTS.CENTRO_BY_ID(id), {
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
    const response = await apiClient(ENDPOINTS.CENTRO_BY_ID(id), {
      method: "DELETE",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },
};
