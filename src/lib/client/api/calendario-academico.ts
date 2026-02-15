import type {
  SemestreLetivo,
  SemestreLetivoWithEventos,
  EventoCalendario,
  CategoriaEvento,
} from "@/lib/shared/types/calendario.types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors/api-error";
import { apiClient } from "./api-client";

export const calendarioAcademicoService = {
  // =========================================================================
  // Semesters
  // =========================================================================

  getAllSemestres: async (): Promise<SemestreLetivo[]> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  getSemestreAtivo: async (): Promise<SemestreLetivo | null> => {
    const response = await apiClient(`${ENDPOINTS.CALENDARIO_ACADEMICO}?ativo=true`, {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  getSemestreById: async (id: string): Promise<SemestreLetivoWithEventos> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_BY_ID(id), {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  createSemestre: async (
    data: { nome: string; dataInicio: string; dataFim: string },
    token: string
  ): Promise<SemestreLetivo> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO, {
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

  updateSemestre: async (
    id: string,
    data: { nome?: string; dataInicio?: string; dataFim?: string },
    token: string
  ): Promise<SemestreLetivo> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_BY_ID(id), {
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

  deleteSemestre: async (id: string, token: string): Promise<void> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_BY_ID(id), {
      method: "DELETE",
      token,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },

  // =========================================================================
  // Events
  // =========================================================================

  getEventos: async (semestreId: string): Promise<EventoCalendario[]> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_EVENTOS(semestreId), {
      method: "GET",
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  },

  createEvento: async (
    semestreId: string,
    data: {
      descricao: string;
      dataInicio: string;
      dataFim: string;
      categoria: CategoriaEvento;
    },
    token: string
  ): Promise<EventoCalendario> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_EVENTOS(semestreId), {
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

  batchCreateEventos: async (
    semestreId: string,
    data: {
      eventos: Array<{
        descricao: string;
        dataInicio: string;
        dataFim: string;
        categoria: CategoriaEvento;
      }>;
      replace: boolean;
    },
    token: string
  ): Promise<{ count: number }> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_EVENTOS_BATCH(semestreId), {
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

  updateEvento: async (
    semestreId: string,
    eventoId: string,
    data: {
      descricao?: string;
      dataInicio?: string;
      dataFim?: string;
      categoria?: CategoriaEvento;
    },
    token: string
  ): Promise<EventoCalendario> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_EVENTO(semestreId, eventoId), {
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

  deleteEvento: async (semestreId: string, eventoId: string, token: string): Promise<void> => {
    const response = await apiClient(ENDPOINTS.CALENDARIO_ACADEMICO_EVENTO(semestreId, eventoId), {
      method: "DELETE",
      token,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },
};
