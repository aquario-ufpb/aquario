import { verifyToken } from "@/lib/server/services/jwt/jwt";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
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
    return ApiError.tokenMissing();
  }

  const payload = verifyToken(token);

  if (!payload) {
    return ApiError.tokenInvalid();
  }

  const { usuariosRepository } = getContainer();
  const usuario = await usuariosRepository.findById(payload.sub);

  if (!usuario) {
    return ApiError.userNotFound();
  }

  return handler(request, usuario);
}

/**
 * Middleware wrapper for admin-only routes
 * Requires user to be authenticated and have MASTER_ADMIN role
 */
export function withAdmin(
  request: Request,
  handler: (req: Request, usuario: UsuarioWithRelations) => Promise<Response>
): Promise<Response> {
  return withAuth(request, (req, usuario) => {
    if (usuario.papelPlataforma !== "MASTER_ADMIN") {
      return Promise.resolve(
        ApiError.forbidden("Acesso negado. Permissão de administrador necessária.")
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
  return await usuariosRepository.findById(payload.sub);
}

/**
 * Check if user can create or delete a vaga for the given entidade.
 * Allowed: MASTER_ADMIN or ADMIN of that entidade (active membership).
 */
export async function canManageVagaForEntidade(
  usuario: UsuarioWithRelations,
  entidadeId: string
): Promise<boolean> {
  if (usuario.papelPlataforma === "MASTER_ADMIN") {
    return true;
  }
  const { membrosRepository } = getContainer();
  const membership = await membrosRepository.findActiveByUsuarioAndEntidade(usuario.id, entidadeId);
  return membership?.papel === "ADMIN";
}

/**
 * Check if user can manage a projeto (edit/delete/publish/replace authors).
 * Allowed:
 *   - MASTER_ADMIN
 *   - any user listed as a user-author of the projeto (principal or co-author)
 *   - active ADMIN of the *principal* entidade-author of the projeto
 *
 * Note: admins of co-author entidades do NOT inherit edit rights — only the
 * principal entidade's admins do. Mirrors the intent of "the entidade that
 * owns this project gets to manage it; co-authorship is just attribution."
 */
export async function canManageProjeto(
  usuario: UsuarioWithRelations,
  autores: { usuarioId: string | null; entidadeId: string | null; autorPrincipal: boolean }[]
): Promise<boolean> {
  if (usuario.papelPlataforma === "MASTER_ADMIN") {
    return true;
  }

  if (autores.some(a => a.usuarioId === usuario.id)) {
    return true;
  }

  const principalEntidadeId = autores.find(a => a.autorPrincipal && a.entidadeId)?.entidadeId;
  if (principalEntidadeId && (await canManageVagaForEntidade(usuario, principalEntidadeId))) {
    return true;
  }

  return false;
}
