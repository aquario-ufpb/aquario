const disposableDatabaseNamePattern = /^aquario_sigaa_test(?:_(?!prod(?:uction)?$)[a-z0-9]+)?$/;
const loopbackHosts: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function assertDisposableSigaaDatabase(databaseUrl: string | undefined): void {
  if (!databaseUrl) {
    throw new Error(
      "Refusing destructive SIGAA repository tests without a disposable DATABASE_URL."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("Refusing destructive SIGAA repository tests with an invalid DATABASE_URL.");
  }

  let databaseName = "";
  try {
    databaseName = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error("Refusing destructive SIGAA repository tests with an invalid database name.");
  }

  const isPostgres = parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  const isLoopback = loopbackHosts.has(parsed.hostname.toLowerCase());
  const isDisposableDatabase = disposableDatabaseNamePattern.test(databaseName);

  if (!isPostgres || !isLoopback || !isDisposableDatabase) {
    throw new Error(
      "Refusing destructive SIGAA repository tests outside a loopback database named aquario_sigaa_test[_suffix]."
    );
  }
}
