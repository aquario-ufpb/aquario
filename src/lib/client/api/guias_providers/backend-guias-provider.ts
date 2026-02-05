import { Guia, Secao, SubSecao } from "@/lib/shared/types";
import { ENDPOINTS } from "@/lib/shared/config/constants";
import { GuiasDataProvider } from "./guias-provider.interface";
import { apiClient } from "../api-client";
import { throwApiError } from "@/lib/client/errors";

export class BackendGuiasProvider implements GuiasDataProvider {
  async getAll(): Promise<Guia[]> {
    const response = await apiClient("/guias", { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  }

  async getSecoes(guiaSlug: string): Promise<Secao[]> {
    const guias = await this.getAll();
    const guia = guias.find(g => g.slug === guiaSlug);
    if (!guia) {
      throw new Error(`Guia with slug '${guiaSlug}' not found`);
    }

    const response = await apiClient(`${ENDPOINTS.SECOES(guia.id)}`, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  }

  async getSubSecoes(secaoSlug: string): Promise<SubSecao[]> {
    const guias = await this.getAll();
    let targetSecao = null;

    for (const guia of guias) {
      const secoes = await this.getSecoes(guia.slug);
      const secao = secoes.find(s => s.slug === secaoSlug);
      if (secao) {
        targetSecao = secao;
        break;
      }
    }

    if (!targetSecao) {
      throw new Error(`Secao with slug '${secaoSlug}' not found`);
    }

    const response = await apiClient(`${ENDPOINTS.SUBSECOES(targetSecao.id)}`, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  }

  async getCentros(): Promise<Array<{ id: string; nome: string; sigla: string }>> {
    const response = await apiClient(`${ENDPOINTS.CENTROS}`, { method: "GET" });
    if (!response.ok) {
      await throwApiError(response);
    }
    return response.json();
  }

  async getCursos(
    centroSigla: string
  ): Promise<Array<{ id: string; nome: string; centroId: string; realId: string }>> {
    const centrosResponse = await apiClient(`${ENDPOINTS.CENTROS}`, { method: "GET" });
    if (!centrosResponse.ok) {
      await throwApiError(centrosResponse);
    }
    const centros = await centrosResponse.json();
    const centro = centros.find((c: { sigla: string }) => c.sigla === centroSigla);

    if (!centro) {
      throw new Error(`Centro with sigla '${centroSigla}' not found`);
    }

    const cursosResponse = await apiClient(`${ENDPOINTS.CURSOS(centro.id)}`, { method: "GET" });
    if (!cursosResponse.ok) {
      await throwApiError(cursosResponse);
    }
    const cursos = await cursosResponse.json();

    return cursos.map((curso: { id: string; nome: string; centroId: string }) => ({
      id: this.nomeToSlug(curso.nome),
      nome: curso.nome,
      centroId: curso.centroId,
      realId: curso.id,
    }));
  }

  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
}
