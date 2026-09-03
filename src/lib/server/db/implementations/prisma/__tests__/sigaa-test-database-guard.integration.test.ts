import { describe, expect, it } from "vitest";
import { assertDisposableSigaaDatabase } from "./sigaa-test-database-guard";

describe("assertDisposableSigaaDatabase", () => {
  it.each([
    ["missing DATABASE_URL", undefined],
    ["malformed DATABASE_URL", "not-a-url"],
    ["non-PostgreSQL protocol", "mysql://user:secret@localhost/aquario_sigaa_test"],
    ["remote host", "postgresql://user:secret@database.example.com/aquario_sigaa_test"],
    ["local non-test database", "postgresql://user:secret@localhost/aquario"],
    ["production-looking suffix", "postgresql://user:secret@localhost/aquario_sigaa_test_prod"],
  ])("rejects %s", (_caseName, databaseUrl) => {
    expect(() => assertDisposableSigaaDatabase(databaseUrl)).toThrow(/Refusing destructive SIGAA/);
  });

  it.each([
    "postgresql://user:secret@localhost/aquario_sigaa_test",
    "postgres://user:secret@127.0.0.1/aquario_sigaa_test_a1b2c3",
    "postgresql://user:secret@[::1]/aquario_sigaa_test_123",
  ])("accepts the disposable loopback database %s", databaseUrl => {
    expect(() => assertDisposableSigaaDatabase(databaseUrl)).not.toThrow();
  });
});
