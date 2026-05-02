/**
 * Mirrors the server-side `canManageProjeto` helper in
 * `src/lib/server/services/auth/middleware.ts`. Used to gate the "Editar"
 * button and the edit page itself client-side. Server still authoritatively
 * enforces the same rule on every mutating endpoint.
 *
 * Allowed:
 *   - MASTER_ADMIN (any project)
 *   - any user listed as a user-author (principal or co-author)
 *   - active ADMIN of the *principal* entidade-author
 */

type ProjetoAutor = {
  usuarioId?: string | null;
  entidadeId?: string | null;
  autorPrincipal: boolean;
};

type CurrentUser = {
  id: string;
  papelPlataforma: "USER" | "MASTER_ADMIN";
};

export function canEditProjeto(
  user: CurrentUser | null | undefined,
  autores: ProjetoAutor[],
  myAdminEntidadeIds: ReadonlySet<string>
): boolean {
  if (!user) {
    return false;
  }
  if (user.papelPlataforma === "MASTER_ADMIN") {
    return true;
  }
  if (autores.some(a => a.usuarioId === user.id)) {
    return true;
  }
  const principalEntidadeId = autores.find(a => a.autorPrincipal && a.entidadeId)?.entidadeId;
  if (principalEntidadeId && myAdminEntidadeIds.has(principalEntidadeId)) {
    return true;
  }
  return false;
}
