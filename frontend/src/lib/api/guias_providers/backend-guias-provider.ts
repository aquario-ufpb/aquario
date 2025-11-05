import { Guia, Secao, SubSecao } from "../../types";
import { API_URL, ENDPOINTS } from "../../config/constants";
import { GuiasDataProvider } from "./guias-provider.interface";

export class BackendGuiasProvider implements GuiasDataProvider {
  async getAll(): Promise<Guia[]> {
    // Get all guias for Centro de Informática
    // Since we're consolidating, we'll fetch all guias regardless of course
    const response = await fetch(`${API_URL}/guias`);
    if (!response.ok) {
      throw new Error("Failed to fetch guias");
    }
    return response.json();
  }

  async getSecoes(guiaSlug: string): Promise<Secao[]> {
    // For backend, we need to find the guia by slug and get its ID
    const guias = await this.getAll();
    const guia = guias.find(g => g.slug === guiaSlug);
    if (!guia) {
      throw new Error(`Guia with slug '${guiaSlug}' not found`);
    }

    const response = await fetch(`${API_URL}${ENDPOINTS.SECOES(guia.id)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch secoes");
    }
    return response.json();
  }

  async getSubSecoes(secaoSlug: string): Promise<SubSecao[]> {
    // For backend, we need to find the secao by slug and get its ID
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

    const response = await fetch(`${API_URL}${ENDPOINTS.SUBSECOES(targetSecao.id)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch subSecoes");
    }
    return response.json();
  }

  async getCentros(): Promise<Array<{ id: string; nome: string; sigla: string }>> {
    const response = await fetch(`${API_URL}${ENDPOINTS.CENTROS}`);
    if (!response.ok) {
      throw new Error("Failed to fetch centros");
    }
    return response.json();
  }

  async getCursos(
    centroSigla: string
  ): Promise<Array<{ id: string; nome: string; centroId: string; realId: string }>> {
    // First get the centro ID by sigla
    const centrosResponse = await fetch(`${API_URL}${ENDPOINTS.CENTROS}`);
    if (!centrosResponse.ok) {
      throw new Error("Failed to fetch centros");
    }
    const centros = await centrosResponse.json();
    const centro = centros.find((c: { sigla: string }) => c.sigla === centroSigla);

    if (!centro) {
      throw new Error(`Centro with sigla '${centroSigla}' not found`);
    }

    // Then get cursos for this centro
    const cursosResponse = await fetch(`${API_URL}${ENDPOINTS.CURSOS(centro.id)}`);
    if (!cursosResponse.ok) {
      throw new Error("Failed to fetch cursos");
    }
    const cursos = await cursosResponse.json();

    // Map the real course data to include slug-based IDs for frontend compatibility
    return cursos.map((curso: { id: string; nome: string; centroId: string }) => ({
      id: this.nomeToSlug(curso.nome), // Convert nome to slug for frontend compatibility
      nome: curso.nome,
      centroId: curso.centroId,
      realId: curso.id, // Keep the real ID for API calls
    }));
  }

  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  }
}
