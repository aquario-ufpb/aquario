import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/services/jwt/jwt";
import { getContainer } from "@/lib/server/container";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

export type AuthenticatedRequest = Request & {
  usuario: UsuarioWithRelations;
};

/**
 * Extract bearer token from Authorization header
 */
function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Middleware wrapper for protected routes
 * Verifies the JWT token and attaches the user to the request
 */
export async function withAuth(
  request: Request,
  handler: (req: Request, usuario: UsuarioWithRelations) => Promise<Response>
): Promise<Response> {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
  }

  const { usuariosRepository } = getContainer();
  const usuario = await usuariosRepository.findById(payload.sub);

  if (!usuario) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
  }

  return handler(request, usuario);
}

/**
 * Middleware wrapper for admin-only routes
 * Requires user to be authenticated and have MASTER_ADMIN role
 */
export async function withAdmin(
  request: Request,
  handler: (req: Request, usuario: UsuarioWithRelations) => Promise<Response>
): Promise<Response> {
  return withAuth(request, async (req, usuario) => {
    if (usuario.papelPlataforma !== "MASTER_ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado. Permissão de administrador necessária." },
        { status: 403 }
      );
    }

    return handler(req, usuario);
  });
}

/**
 * Get user from token (optional auth)
 * Returns null if no valid token is present
 */
export async function getOptionalUser(request: Request): Promise<UsuarioWithRelations | null> {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const { usuariosRepository } = getContainer();
  return usuariosRepository.findById(payload.sub);
}

