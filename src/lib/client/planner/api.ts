import type {
  OfferingBatchRequest,
  OfferingBatchResponse,
  OfferingSnapshotRequest,
  OfferingSnapshotResponse,
} from "@/lib/shared/planner/offering-search";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import type {
  PlannerDraft,
  OfferingResponse,
  PublicCourse,
  PlanSummary,
  SavedPlan,
} from "@/lib/shared/planner/types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiClient(path, options);
  if (!response.ok) {
    await throwApiError(response);
  }
  return response.json();
}
export const plannerApi = {
  courses: () => request<{ courses: PublicCourse[] }>("/planejador/ofertas"),
  offerings: (courseId: string, semester: string, signal?: AbortSignal, refresh = false) =>
    request<OfferingResponse>(
      `/planejador/ofertas?curso=${encodeURIComponent(courseId)}&semestre=${encodeURIComponent(semester)}${refresh ? "&atualizar=1" : ""}`,
      { signal }
    ),
  offeringBatch: (body: OfferingBatchRequest, signal?: AbortSignal) =>
    request<OfferingBatchResponse>("/planejador/ofertas/abrangentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  offeringSnapshot: (body: OfferingSnapshotRequest, signal?: AbortSignal) =>
    request<OfferingSnapshotResponse>("/planejador/ofertas/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  list: () => request<PlanSummary[]>("/usuarios/me/planejamentos"),
  load: (id: string) => request<SavedPlan>(`/usuarios/me/planejamentos/${encodeURIComponent(id)}`),
  save: (name: string, draft: PlannerDraft, existing?: PlanSummary | null) =>
    request<SavedPlan>(`/usuarios/me/planejamentos${existing ? `/${existing.id}` : ""}`, {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        draft,
        ...(existing ? { expectedUpdatedAt: existing.updatedAt } : {}),
      }),
    }),
  remove: (id: string) =>
    request<{ deleted: true }>(`/usuarios/me/planejamentos/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
