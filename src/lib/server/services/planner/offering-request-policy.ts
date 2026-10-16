import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { getOptionalUser } from "@/lib/server/services/auth/middleware";
import { getClientIP } from "@/lib/server/services/rate-limit/rate-limiter";

export async function offeringRequestPolicy(request: Request, refresh = false) {
  const repository = getContainer().publicOfferingCacheRepository;
  const key = createHash("sha256").update(getClientIP(request)).digest("hex");
  if (!(await repository.consumeRequest(`offering:${key}`, 40, 60000))) {
    return {
      response: NextResponse.json(
        { message: "Muitas consultas de oferta. Aguarde um minuto." },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
      refresh: false,
    };
  }
  // Public reads remain anonymous. Bypassing freshness requires a verified session and a smaller budget.
  const user = refresh ? await getOptionalUser(request) : null;
  const allowedRefresh =
    !!user && (await repository.consumeRequest(`offering-refresh:${user.id}`, 3, 60000));
  if (user && !allowedRefresh) {
    return {
      response: NextResponse.json(
        { message: "Aguarde antes de atualizar a oferta novamente." },
        { status: 429, headers: { "Retry-After": "60" } }
      ),
      refresh: false,
    };
  }
  return { response: null, refresh: allowedRefresh };
}
