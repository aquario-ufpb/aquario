import type { GradeCurricularResponse } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const curriculosService = {
  getGradeByCurso: async (cursoId: string): Promise<GradeCurricularResponse> => {
    const response = await apiClient(ENDPOINTS.GRADE_CURRICULAR(cursoId), {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },
};
