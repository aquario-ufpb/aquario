import { Curso } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const cursosService = {
  getByCentro: async (centroId: string): Promise<Curso[]> => {
    const response = await apiClient(`${ENDPOINTS.CURSOS(centroId)}`, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },
};
