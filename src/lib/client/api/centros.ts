import { Centro } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const centrosService = {
  getAll: async (): Promise<Centro[]> => {
    const response = await apiClient(`${ENDPOINTS.CENTROS}`, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },
};
