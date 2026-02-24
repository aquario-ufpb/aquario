import type { Vaga, TipoVaga, EntidadeVaga } from "@/lib/shared/types";
import { VagasDataProvider } from "./vagas_providers/vagas-provider.interface";
import { BackendVagasProvider } from "./vagas_providers/backend-vagas-provider";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { apiClient } from "./api-client";
import { throwApiError } from "@/lib/client/errors";

const provider: VagasDataProvider = new BackendVagasProvider();

export type CreateVagaRequest = {
  titulo: string;
  descricao: string;
  tipoVaga: TipoVaga;
  entidadeId: string;
  linkInscricao: string;
  dataFinalizacao: string;
  areas?: string[];
  salario?: string | null;
  sobreEmpresa?: string | null;
  responsabilidades?: string[];
  requisitos?: string[];
  informacoesAdicionais?: string | null;
  etapasProcesso?: string[];
};

export const vagasService = {
  getAll: async (): Promise<Vaga[]> => {
    return await provider.getAll();
  },

  getById: async (id: string): Promise<Vaga | null> => {
    return await provider.getById(id);
  },

  getByTipo: async (tipo: TipoVaga): Promise<Vaga[]> => {
    return await provider.getByTipo(tipo);
  },

  getByEntidade: async (entidade: EntidadeVaga): Promise<Vaga[]> => {
    return await provider.getByEntidade(entidade);
  },

  create: async (data: CreateVagaRequest, token: string): Promise<Vaga> => {
    const response = await apiClient(ENDPOINTS.VAGAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      token,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
    const json = await response.json();
    return json as Vaga;
  },

  delete: async (id: string, token: string): Promise<void> => {
    const response = await apiClient(ENDPOINTS.VAGA_BY_ID(id), {
      method: "DELETE",
      token,
    });
    if (!response.ok) {
      await throwApiError(response);
    }
  },
};
