import { getContainer } from "@/lib/server/container";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { createLogger } from "@/lib/server/utils/logger";
import type { Prisma } from "@prisma/client";

const auditLogger = createLogger("audit-log");

export type AuditLogEvent = {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

/**
 * `actor` nulo registra uma ação de quem já não existe (ex.: a própria conta acabou de ser
 * excluída); o id fica em `resourceId`.
 */
export async function recordAuditLog(
  request: Request,
  actor: UsuarioWithRelations | null,
  event: AuditLogEvent
): Promise<void> {
  try {
    const { auditLogsRepository } = getContainer();

    await auditLogsRepository.create({
      actorUsuarioId: actor?.id ?? null,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? null,
      metadata: event.metadata ?? {},
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    auditLogger.error("Failed to record audit log", error, {
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      actorUsuarioId: actor?.id ?? null,
    });
  }
}
