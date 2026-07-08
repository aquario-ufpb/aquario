import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

export function GET(request: Request) {
  return withAdmin(request, async () => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "25", 10) || 25), 100);
    const action = searchParams.get("action")?.trim() || undefined;
    const resourceType = searchParams.get("resourceType")?.trim() || undefined;
    const actorUsuarioId = searchParams.get("actorUsuarioId")?.trim() || undefined;

    const { auditLogsRepository } = getContainer();
    const { auditLogs, total } = await auditLogsRepository.findManyPaginated({
      page,
      limit,
      action,
      resourceType,
      actorUsuarioId,
    });

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
