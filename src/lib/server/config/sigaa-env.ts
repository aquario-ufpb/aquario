import { z } from "zod";

import { isExplicitLoopbackHostname } from "@/lib/server/services/sigaa/connector/explicit-loopback-hostname";

export const SIGAA_ENV_NAMES = {
  reauthJwtSecret: "SIGAA_REAUTH_JWT_SECRET",
  connectorUrl: "SIGAA_CONNECTOR_URL",
  connectorApiSecret: "SIGAA_CONNECTOR_API_SECRET",
  connectorAllowedOrigins: "SIGAA_CONNECTOR_ALLOWED_ORIGINS",
  connectorAllowLocalHttp: "SIGAA_CONNECTOR_ALLOW_LOCAL_HTTP",
} as const;

type ServerEnvironment = Readonly<Record<string, string | undefined>>;

const secretSchema = z.string().min(32);
const connectorUrlSchema = z.string().url();

export type SigaaReauthEnvironment = Readonly<{
  jwtSecret: string;
}>;

export type SigaaConnectorEnvironment = Readonly<{
  url: URL;
  apiSecret: string;
  allowedOrigins: readonly string[];
  allowLocalHttp: boolean;
}>;

function readRequired(
  environment: ServerEnvironment,
  name: (typeof SIGAA_ENV_NAMES)[keyof typeof SIGAA_ENV_NAMES],
  schema: z.ZodType<string>
): string {
  const parsed = schema.safeParse(environment[name]);

  if (!parsed.success) {
    throw new Error(`${name} is missing or invalid`);
  }

  return parsed.data;
}

export function readSigaaReauthEnvironment(
  environment: ServerEnvironment = process.env
): SigaaReauthEnvironment {
  const jwtSecret = readRequired(environment, SIGAA_ENV_NAMES.reauthJwtSecret, secretSchema);

  if (environment.JWT_SECRET && jwtSecret === environment.JWT_SECRET) {
    throw new Error("SIGAA_REAUTH_JWT_SECRET must differ from JWT_SECRET");
  }

  if (
    environment[SIGAA_ENV_NAMES.connectorApiSecret] &&
    jwtSecret === environment[SIGAA_ENV_NAMES.connectorApiSecret]
  ) {
    throw new Error("SIGAA_REAUTH_JWT_SECRET must differ from SIGAA_CONNECTOR_API_SECRET");
  }

  return { jwtSecret };
}

export function readSigaaConnectorEnvironment(
  environment: ServerEnvironment = process.env
): SigaaConnectorEnvironment {
  const rawUrl = readRequired(environment, SIGAA_ENV_NAMES.connectorUrl, connectorUrlSchema);
  const apiSecret = readRequired(environment, SIGAA_ENV_NAMES.connectorApiSecret, secretSchema);
  const rawAllowedOrigins = readRequired(
    environment,
    SIGAA_ENV_NAMES.connectorAllowedOrigins,
    z.string().min(1)
  );
  const url = new URL(rawUrl);
  const localHttpFlag = z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .safeParse(environment[SIGAA_ENV_NAMES.connectorAllowLocalHttp]);

  if (!localHttpFlag.success) {
    throw new Error("SIGAA_CONNECTOR_ALLOW_LOCAL_HTTP must be true or false");
  }

  const allowLocalHttp = localHttpFlag.data === "true";
  const isDevelopment = environment.NODE_ENV === "development";
  const isLocalHostname = isExplicitLoopbackHostname(url.hostname);

  if (
    url.pathname !== "/v1/sync" ||
    url.search !== "" ||
    url.hash !== "" ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new Error("SIGAA_CONNECTOR_URL must be the exact /v1/sync endpoint");
  }

  if (allowLocalHttp && !isDevelopment) {
    throw new Error("SIGAA_CONNECTOR_ALLOW_LOCAL_HTTP is allowed only in development");
  }

  const localHttpAllowed =
    allowLocalHttp && isDevelopment && url.protocol === "http:" && isLocalHostname;

  if (url.protocol !== "https:" && !localHttpAllowed) {
    throw new Error("SIGAA_CONNECTOR_URL must use HTTPS");
  }

  if (
    (environment.JWT_SECRET && apiSecret === environment.JWT_SECRET) ||
    (environment[SIGAA_ENV_NAMES.reauthJwtSecret] &&
      apiSecret === environment[SIGAA_ENV_NAMES.reauthJwtSecret])
  ) {
    throw new Error("SIGAA_CONNECTOR_API_SECRET must be unique");
  }

  const allowedOrigins = rawAllowedOrigins.split(",").map(origin => origin.trim());

  if (allowedOrigins.some(origin => origin.length === 0)) {
    throw new Error("SIGAA_CONNECTOR_ALLOWED_ORIGINS contains an empty origin");
  }

  for (const origin of allowedOrigins) {
    let parsedOrigin: URL;

    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error("SIGAA_CONNECTOR_ALLOWED_ORIGINS contains an invalid origin");
    }

    if (parsedOrigin.origin !== origin || parsedOrigin.pathname !== "/") {
      throw new Error("SIGAA_CONNECTOR_ALLOWED_ORIGINS must contain canonical origins only");
    }

    const localAllowedOrigin =
      allowLocalHttp &&
      isDevelopment &&
      parsedOrigin.protocol === "http:" &&
      isExplicitLoopbackHostname(parsedOrigin.hostname);

    if (parsedOrigin.protocol !== "https:" && !localAllowedOrigin) {
      throw new Error("SIGAA_CONNECTOR_ALLOWED_ORIGINS must use HTTPS");
    }
  }

  if (new Set(allowedOrigins).size !== allowedOrigins.length) {
    throw new Error("SIGAA_CONNECTOR_ALLOWED_ORIGINS contains duplicate origins");
  }

  if (!allowedOrigins.includes(url.origin)) {
    throw new Error("SIGAA_CONNECTOR_URL origin is not allowed");
  }

  return { url, apiSecret, allowedOrigins, allowLocalHttp };
}
