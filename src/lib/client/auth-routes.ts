export const AUTH_ROUTES: ReadonlySet<string> = new Set([
  "/login",
  "/registro",
  "/esqueci-senha",
  "/resetar-senha",
  "/verificar-email",
]);

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}
