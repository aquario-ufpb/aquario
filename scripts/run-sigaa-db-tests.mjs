import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const databaseNamePattern = /^aquario_sigaa_test(?:_[a-z0-9]+)?$/;
let containerName = null;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: options.env ?? process.env,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const output = options.capture ? `${result.stdout ?? ""}${result.stderr ?? ""}` : "";
    throw new Error(`${command} exited with ${result.status}${output ? `\n${output}` : ""}`);
  }
  return result.stdout?.trim() ?? "";
}

function assertDisposableDatabase(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.slice(1).split("?")[0];
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!isLocal || !databaseNamePattern.test(databaseName)) {
    throw new Error(
      "Refusing SIGAA DB tests outside a local disposable database named aquario_sigaa_test[_suffix]."
    );
  }
}

function startPostgres() {
  const suffix = randomBytes(6).toString("hex");
  containerName = `aquario-sigaa-test-${suffix}`;
  const password = randomBytes(18).toString("hex");
  run("docker", [
    "run",
    "--rm",
    "--detach",
    "--name",
    containerName,
    "--env",
    `POSTGRES_PASSWORD=${password}`,
    "--env",
    "POSTGRES_DB=aquario_sigaa_test",
    "--publish",
    "127.0.0.1::5432",
    "postgres:16-alpine",
  ]);

  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const probe = spawnSync("docker", ["exec", containerName, "pg_isready", "-U", "postgres"], {
      stdio: "ignore",
    });
    if (probe.status === 0) {
      ready = true;
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  if (!ready) {
    throw new Error("Disposable PostgreSQL did not become ready within 30 seconds.");
  }

  const portOutput = run("docker", ["port", containerName, "5432/tcp"], { capture: true });
  const port = portOutput.match(/:(\d+)$/)?.[1];
  if (!port) {
    throw new Error("Could not resolve the disposable PostgreSQL port.");
  }
  return `postgresql://postgres:${password}@127.0.0.1:${port}/aquario_sigaa_test`;
}

try {
  const databaseUrl = process.env.SIGAA_TEST_DATABASE_URL || startPostgres();
  assertDisposableDatabase(databaseUrl);
  const environment = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    NODE_ENV: "test",
  };

  run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: environment,
  });
  run(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "diff",
      "--from-url",
      databaseUrl,
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    { env: environment }
  );
  run(
    process.execPath,
    [
      "node_modules/vitest/vitest.mjs",
      "--run",
      "src/lib/server/db/implementations/prisma/__tests__/prisma-sigaa-repository.integration.test.ts",
      "--reporter=verbose",
    ],
    { env: environment }
  );
} finally {
  if (containerName) {
    spawnSync("docker", ["rm", "--force", containerName], { stdio: "ignore" });
  }
}
