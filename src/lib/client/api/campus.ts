import type { Campus } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const campusService = {
  getAll: async (): Promise<Campus[]> => {
    const response = await apiClient(ENDPOINTS.CAMPUS, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  create: async (data: { nome: string }): Promise<Campus> => {
    const response = await apiClient(ENDPOINTS.CAMPUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  update: async (id: string, data: { nome: string }): Promise<Campus> => {
    const response = await apiClient(ENDPOINTS.CAMPUS_BY_ID(id), {
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
    const response = await apiClient(ENDPOINTS.CAMPUS_BY_ID(id), {
      method: "DELETE",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },
};
