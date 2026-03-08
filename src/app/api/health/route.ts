import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const unusedVar = "this will fail lint";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
