import type {
  DisciplinasSemestreListResponse,
  DisciplinaSemestreResponse,
  SaveDisciplinasSemestreRequest,
  MarcarDisciplinasRequest,
  PatchDisciplinaSemestreRequest,
  DisciplinaSearchResult,
} from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export const disciplinaSemestreService = {
  getByActiveSemestre: async (token: string): Promise<DisciplinasSemestreListResponse> => {
    const response = await apiClient(ENDPOINTS.DISCIPLINAS_SEMESTRE_ME("ativo"), {
      method: "GET",
      token,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  saveForActiveSemestre: async (
    data: SaveDisciplinasSemestreRequest,
    token: string
  ): Promise<DisciplinasSemestreListResponse> => {
    const response = await apiClient(ENDPOINTS.DISCIPLINAS_SEMESTRE_ME("ativo"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      token,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  marcarDisciplinas: async (
    data: MarcarDisciplinasRequest,
    token: string
  ): Promise<{ ok: boolean }> => {
    const response = await apiClient(ENDPOINTS.DISCIPLINAS_MARCAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      token,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  patchDisciplinaSemestre: async (
    semestreId: string,
    disciplinaSemestreId: string,
    data: PatchDisciplinaSemestreRequest,
    token: string
  ): Promise<DisciplinaSemestreResponse> => {
    const response = await apiClient(
      ENDPOINTS.DISCIPLINA_SEMESTRE_PATCH(semestreId, disciplinaSemestreId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        token,
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  searchDisciplinas: async (query: string): Promise<{ disciplinas: DisciplinaSearchResult[] }> => {
    const response = await apiClient(
      `${ENDPOINTS.DISCIPLINAS_SEARCH}?q=${encodeURIComponent(query)}`,
      { method: "GET" }
    );
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },
};
