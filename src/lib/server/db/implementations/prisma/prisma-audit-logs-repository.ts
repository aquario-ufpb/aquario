import { prisma } from "@/lib/server/db/prisma";
import type {
  AuditLogCreateInput,
  AuditLogListOptions,
  IAuditLogsRepository,
} from "@/lib/server/db/interfaces/audit-logs-repository.interface";
import type { AuditLogWithActor } from "@/lib/server/db/interfaces/types";
import { Prisma } from "@prisma/client";

const actorSelect = {
  id: true,
  nome: true,
  email: true,
} as const;

export class PrismaAuditLogsRepository implements IAuditLogsRepository {
  async create(data: AuditLogCreateInput): Promise<AuditLogWithActor> {
    return await prisma.auditLog.create({
      data: {
        actorUsuarioId: data.actorUsuarioId ?? null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId ?? null,
        metadata: data.metadata ?? {},
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
      include: {
        actorUsuario: {
          select: actorSelect,
        },
      },
    });
  }

  async findManyPaginated(options: AuditLogListOptions): Promise<{
    auditLogs: AuditLogWithActor[];
    total: number;
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(options.action ? { action: options.action } : {}),
      ...(options.resourceType ? { resourceType: options.resourceType } : {}),
      ...(options.actorUsuarioId ? { actorUsuarioId: options.actorUsuarioId } : {}),
    };

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actorUsuario: {
            select: actorSelect,
          },
        },
        orderBy: {
          criadoEm: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { auditLogs, total };
  }
}
