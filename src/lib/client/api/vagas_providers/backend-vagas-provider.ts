import type { Vaga, TipoVaga, EntidadeVaga } from "@/lib/shared/types";
import { VagasDataProvider } from "./vagas-provider.interface";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { ENTIDADE_TIPO_MAP } from "@/lib/shared/types/vaga.types";
import { apiClient } from "../api-client";
import { throwApiError } from "@/lib/client/errors";

type ApiVagaResponse = {
  id: string;
  titulo: string;
  descricao: string;
  tipoVaga: string;
  areas: string[];
  criadoEm: string;
  dataFinalizacao?: string;
  linkInscricao: string;
  salario?: string;
  sobreEmpresa?: string;
  responsabilidades: string[];
  requisitos: string[];
  informacoesAdicionais?: string;
  etapasProcesso: string[];
  entidade: { id: string; nome: string; slug?: string; tipo?: string; urlFoto?: string };
  publicador: { nome: string; urlFotoPerfil?: string };
};

function mapApiVagaToVaga(api: ApiVagaResponse): Vaga {
  return {
    id: api.id,
    titulo: api.titulo,
    descricao: api.descricao,
    tipoVaga: api.tipoVaga as TipoVaga,
    areas: api.areas ?? [],
    criadoEm: api.criadoEm,
    dataFinalizacao: api.dataFinalizacao,
    linkInscricao: api.linkInscricao,
    salario: api.salario,
    sobreEmpresa: api.sobreEmpresa,
    responsabilidades: api.responsabilidades ?? [],
    requisitos: api.requisitos ?? [],
    informacoesAdicionais: api.informacoesAdicionais,
    etapasProcesso: api.etapasProcesso ?? [],
    entidade: api.entidade,
    publicador: api.publicador,
  };
}

export class BackendVagasProvider implements VagasDataProvider {
  async getAll(): Promise<Vaga[]> {
    const response = await apiClient(ENDPOINTS.VAGAS, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    const data: ApiVagaResponse[] = await response.json();
    return data.map(mapApiVagaToVaga);
  }

  async getById(id: string): Promise<Vaga | null> {
    const response = await apiClient(ENDPOINTS.VAGA_BY_ID(id), { method: "GET" });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      await throwApiError(response);
    }
    const data: ApiVagaResponse = await response.json();
    return mapApiVagaToVaga(data);
  }

  async getByTipo(tipo: TipoVaga): Promise<Vaga[]> {
    const url = `${ENDPOINTS.VAGAS}?tipoVaga=${encodeURIComponent(tipo)}`;
    const response = await apiClient(url, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    const data: ApiVagaResponse[] = await response.json();
    return data.map(mapApiVagaToVaga);
  }

  async getByEntidade(entidade: EntidadeVaga): Promise<Vaga[]> {
    const tipos = ENTIDADE_TIPO_MAP[entidade];
    if (!tipos) {
      return [];
    }
    const url = `${ENDPOINTS.VAGAS}?entidadeTipos=${encodeURIComponent(tipos.join(","))}`;
    const response = await apiClient(url, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    const data: ApiVagaResponse[] = await response.json();
    return data.map(mapApiVagaToVaga);
  }
}
