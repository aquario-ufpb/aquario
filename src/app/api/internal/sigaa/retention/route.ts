import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { getContainer } from "@/lib/server/container";
import { readSigaaRetentionEnvironment } from "@/lib/server/config/sigaa-env";

export const dynamic = "force-dynamic";

const privateHeaders = { "Cache-Control": "private, no-store" };

function isAuthorized(request: Request): "authorized" | "missing_config" | "unauthorized" {
  let configuredSecret: string;
  try {
    configuredSecret = readSigaaRetentionEnvironment().cronSecret;
  } catch {
    return "missing_config";
  }

  const suppliedSecret = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(configuredSecret);
  const supplied = Buffer.from(suppliedSecret);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return "unauthorized";
  }
  return "authorized";
}

export async function GET(request: Request) {
  const authorization = isAuthorized(request);
  if (authorization === "missing_config") {
    return NextResponse.json(
      { message: "Retention job unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 503, headers: privateHeaders }
    );
  }
  if (authorization === "unauthorized") {
    return NextResponse.json(
      { message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401, headers: privateHeaders }
    );
  }

  const result = await getContainer().sigaaRepository.deleteExpiredRuns();
  return NextResponse.json(result, { headers: privateHeaders });
}
