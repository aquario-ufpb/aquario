import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";

export type AuditLogEntry = {
  id: string;
  actorUsuarioId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  criadoEm: string;
  actorUsuario: {
    id: string;
    nome: string;
    email: string | null;
  } | null;
};

export type AuditLogListOptions = {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  actorUsuarioId?: string;
};

export const auditLogsService = {
  list: async (
    token: string,
    options: AuditLogListOptions
  ): Promise<{
    auditLogs: AuditLogEntry[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const params = new URLSearchParams();
    if (options.page) {
      params.append("page", options.page.toString());
    }
    if (options.limit) {
      params.append("limit", options.limit.toString());
    }
    if (options.action) {
      params.append("action", options.action);
    }
    if (options.resourceType) {
      params.append("resourceType", options.resourceType);
    }
    if (options.actorUsuarioId) {
      params.append("actorUsuarioId", options.actorUsuarioId);
    }

    const response = await apiClient(`${ENDPOINTS.AUDIT_LOGS}?${params.toString()}`, {
      method: "GET",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },
};
