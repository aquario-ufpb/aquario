import { apiClient } from "./api-client";
import { throwApiError } from "@/lib/client/errors";
import type { ProjetoWithRelations, ProjetosListResponse } from "@/lib/shared/types/projeto";
import type {
  CreateProjetoInput,
  UpdateProjetoInput,
  UpdateProjetoAutoresInput,
} from "@/lib/shared/validations/projetos";

export type ProjetoStatus = "PUBLICADO" | "RASCUNHO" | "ARQUIVADO";
export type ProjetoOrderBy = "dataInicio" | "criadoEm" | "publicadoEm" | "titulo" | "autoresCount";
export type ProjetoOrder = "asc" | "desc";

/**
 * Params for the listing endpoint. Mirrors `listProjetosSchema` on the server.
 */
export type ListProjetosParams = {
  page?: number;
  limit?: number;
  search?: string;
  tipoEntidade?: string;
  status?: ProjetoStatus;
  orderBy?: ProjetoOrderBy;
  order?: ProjetoOrder;
  scopedToMe?: boolean;
  entidadeId?: string;
  usuarioId?: string;
};

export function buildProjetosQuery(params: ListProjetosParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 12));
  if (params.search?.trim()) {
    qs.set("search", params.search.trim());
  }
  if (params.tipoEntidade) {
    qs.set("tipoEntidade", params.tipoEntidade);
  }
  if (params.status) {
    qs.set("status", params.status);
  }
  if (params.orderBy) {
    qs.set("orderBy", params.orderBy);
  }
  if (params.order) {
    qs.set("order", params.order);
  }
  if (params.scopedToMe) {
    qs.set("scopedToMe", "true");
  }
  if (params.entidadeId) {
    qs.set("entidadeId", params.entidadeId);
  }
  if (params.usuarioId) {
    qs.set("usuarioId", params.usuarioId);
  }
  return qs.toString();
}

/** GET /api/projetos — paginated listing with filters/sort. */
export async function listProjetos(params: ListProjetosParams = {}): Promise<ProjetosListResponse> {
  const res = await apiClient(`/projetos?${buildProjetosQuery(params)}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
}

/**
 * GET /api/projetos — convenience wrapper that returns just the array.
 * Used by the entidade/profile listings that don't need pagination metadata.
 */
export async function fetchProjetos(params: {
  entidadeId?: string;
  usuarioId?: string;
  status?: ProjetoStatus;
  limit?: number;
}): Promise<ProjetoWithRelations[]> {
  const data = await listProjetos({
    entidadeId: params.entidadeId,
    usuarioId: params.usuarioId,
    status: params.status,
    limit: params.limit ?? 50,
  });
  return data.projetos;
}

/** GET /api/projetos/[slug]. */
export async function getProjetoBySlug(slug: string): Promise<ProjetoWithRelations> {
  const res = await apiClient(`/projetos/${slug}`);
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
}

/** POST /api/projetos. */
export async function createProjeto(data: CreateProjetoInput): Promise<ProjetoWithRelations> {
  const res = await apiClient("/projetos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
}

/** PATCH /api/projetos/[slug] — updates projeto fields (does NOT touch autores). */
export async function updateProjeto(
  slug: string,
  data: UpdateProjetoInput
): Promise<ProjetoWithRelations> {
  const res = await apiClient(`/projetos/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
}

/** PUT /api/projetos/[slug]/autores — replaces the full author list. */
export async function updateProjetoAutores(
  slug: string,
  data: UpdateProjetoAutoresInput
): Promise<ProjetoWithRelations> {
  const res = await apiClient(`/projetos/${slug}/autores`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json();
}

/** POST /api/upload/projeto-image — returns the public URL of the uploaded blob. */
export async function uploadProjetoImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient("/upload/projeto-image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

/**
 * DELETE /api/upload/projeto-image — session cleanup for blobs the caller
 * uploaded but didn't commit (cover-replace + cancel). For replacing a
 * committed cover, the PATCH handler GCs the old blob automatically.
 */
export async function deleteProjetoImage(url: string): Promise<void> {
  const res = await apiClient(`/upload/projeto-image?url=${encodeURIComponent(url)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    await throwApiError(res);
  }
}
