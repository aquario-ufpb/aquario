import type { Prisma } from "@prisma/client";
import type { AuditLogWithActor } from "./types";

export type AuditLogCreateInput = {
  actorUsuarioId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditLogListOptions = {
  page?: number;
  limit?: number;
  action?: string;
  resourceType?: string;
  actorUsuarioId?: string;
};

export type IAuditLogsRepository = {
  create(data: AuditLogCreateInput): Promise<AuditLogWithActor>;
  findManyPaginated(options: AuditLogListOptions): Promise<{
    auditLogs: AuditLogWithActor[];
    total: number;
  }>;
};
