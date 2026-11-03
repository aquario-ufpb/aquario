import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { expoPushTokenSchema, registrarDispositivoSchema } from "@/lib/shared/push/push";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { createLogger } from "@/lib/server/utils/logger";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;
const log = createLogger("push-dispositivos");

function privateRoute(
  handler: (request: Request, usuario: UsuarioWithRelations) => Promise<Response>
) {
  return async (request: Request) => {
    let response: Response;
    try {
      response = await withAuth(request, handler);
    } catch (error) {
      log.error(`Falha em ${request.method} /api/usuarios/me/push-dispositivos`, {
        error: String(error),
      });
      response = ApiError.internal("Não foi possível salvar as notificações. Tente novamente.");
    }
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Authorization");
    return response;
  };
}

function tokenFromQuery(request: Request) {
  return expoPushTokenSchema.safeParse(new URL(request.url).searchParams.get("token") ?? "");
}

/**
 * GET /api/usuarios/me/push-dispositivos?token=
 * Preferências deste aparelho (todas desligadas se ele não estiver registrado nesta conta).
 */
export const GET = privateRoute(async (request, usuario) => {
  const token = tokenFromQuery(request);
  if (!token.success) {
    return ApiError.badRequest("Token de push inválido");
  }
  const preferencias = await getContainer().pushDispositivosRepository.find(usuario.id, token.data);
  return NextResponse.json({
    registrado: preferencias !== null,
    preferencias: preferencias ?? { prazos: false, vagas: false, entidades: false },
  });
});

/**
 * PUT /api/usuarios/me/push-dispositivos
 * Registra o aparelho na conta (ou o transfere de outra conta) com as categorias escolhidas.
 */
export const PUT = privateRoute(async (request, usuario) => {
  // Recusa pelo cabeçalho antes de ler; o limite após a leitura cobre envios sem content-length.
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return ApiError.badRequest("Corpo da requisição muito grande");
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return ApiError.badRequest("Corpo da requisição muito grande");
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return ApiError.badRequest("Corpo da requisição inválido");
  }
  const parsed = registrarDispositivoSchema.safeParse(body);
  if (!parsed.success) {
    return ApiError.badRequest("Token, plataforma ou preferências inválidos");
  }
  await getContainer().pushDispositivosRepository.upsert(usuario.id, parsed.data);
  return NextResponse.json({ registrado: true, preferencias: parsed.data.preferencias });
});

/**
 * DELETE /api/usuarios/me/push-dispositivos?token=
 * Remove o aparelho desta conta (logout ou desativação). Idempotente.
 */
export const DELETE = privateRoute(async (request, usuario) => {
  const token = tokenFromQuery(request);
  if (!token.success) {
    return ApiError.badRequest("Token de push inválido");
  }
  await getContainer().pushDispositivosRepository.delete(usuario.id, token.data);
  return new NextResponse(null, { status: 204 });
});
