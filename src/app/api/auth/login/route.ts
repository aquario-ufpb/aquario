import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { authenticate } from "@/lib/server/services/auth/authenticate";
import { checkRateLimit, getClientIP } from "@/lib/server/services/rate-limit/rate-limiter";
import { ApiError, fromZodError, ErrorCode } from "@/lib/server/errors";

// Rate limit: 5 login attempts per minute per IP
const LOGIN_RATE_LIMIT = {
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
};

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: Request) {
  // Check rate limit
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`login:${clientIP}`, LOGIN_RATE_LIMIT);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    const response = ApiError.rateLimited(
      "Muitas tentativas de login. Tente novamente em alguns segundos."
    );
    response.headers.set("Retry-After", String(retryAfter));
    response.headers.set("X-RateLimit-Limit", String(LOGIN_RATE_LIMIT.limit));
    response.headers.set("X-RateLimit-Remaining", "0");
    response.headers.set("X-RateLimit-Reset", String(rateLimitResult.resetAt));
    return response;
  }

  try {
    const body = await request.json();
    const { email, senha } = loginSchema.parse(body);

    const { usuariosRepository } = getContainer();
    const result = await authenticate({ email, senha }, usuariosRepository);

    return NextResponse.json({ token: result.token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fromZodError(error);
    }

    const message = error instanceof Error ? error.message : "Erro no login";

    // Don't reveal whether email exists or password is wrong (prevents enumeration)
    if (message === "EMAIL_NAO_ENCONTRADO" || message === "SENHA_INVALIDA") {
      return ApiError.invalidCredentials();
    }

    if (message === "EMAIL_NAO_VERIFICADO") {
      return ApiError.unauthorized("Email não verificado", ErrorCode.EMAIL_NOT_VERIFIED);
    }

    return ApiError.unauthorized(message);
  }
}
