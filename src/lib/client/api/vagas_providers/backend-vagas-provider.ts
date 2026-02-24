import type { Vaga, TipoVaga, EntidadeVaga } from "@/lib/shared/types";
import { VagasDataProvider } from "./vagas-provider.interface";
import { ENDPOINTS } from "@/lib/shared/config/constants";
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
    linkVaga: api.linkInscricao,
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
      if (response.status === 404) return null;
      await throwApiError(response);
    }
    const data: ApiVagaResponse = await response.json();
    return mapApiVagaToVaga(data);
  }

  async getByTipo(tipo: TipoVaga): Promise<Vaga[]> {
    const all = await this.getAll();
    return all.filter(v => v.tipoVaga === tipo);
  }

  async getByEntidade(entidade: EntidadeVaga): Promise<Vaga[]> {
    const all = await this.getAll();
    const e = entidade.toLowerCase();
    return all.filter(v => {
      if (typeof v.entidade === "string") return v.entidade.toLowerCase() === e;
      return v.entidade.nome.toLowerCase() === e || v.entidade.slug?.toLowerCase() === e;
    });
  }
}
