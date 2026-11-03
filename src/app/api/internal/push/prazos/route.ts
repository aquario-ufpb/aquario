import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { notificarPrazosDeAmanha } from "@/lib/server/services/push/notificacoes";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store" };

/** Cron da Vercel: `Authorization: Bearer $CRON_SECRET`. */
function isAuthorized(request: Request): "authorized" | "missing_config" | "unauthorized" {
  const configured = process.env.CRON_SECRET;
  if (!configured) {
    return "missing_config";
  }
  const supplied = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(configured);
  const received = Buffer.from(supplied);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return "unauthorized";
  }
  return "authorized";
}

/** GET /api/internal/push/prazos — avisa os eventos do calendário que começam amanhã. */
export async function GET(request: Request) {
  const authorization = isAuthorized(request);
  if (authorization === "missing_config") {
    return NextResponse.json(
      { message: "Push job unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 503, headers: privateHeaders }
    );
  }
  if (authorization === "unauthorized") {
    return NextResponse.json(
      { message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders }
    );
  }
  const result = await notificarPrazosDeAmanha();
  return NextResponse.json(result, { headers: privateHeaders });
}
