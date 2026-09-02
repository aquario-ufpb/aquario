import "server-only";

import { readSigaaConnectorEnvironment } from "@/lib/server/config/sigaa-env";

import { HttpSigaaConnector, type ISigaaConnector } from "./connector";

export function createSigaaConnectorFromEnvironment(): ISigaaConnector {
  const environment = readSigaaConnectorEnvironment();
  return new HttpSigaaConnector({
    connectorUrl: environment.url.toString(),
    bearerToken: environment.apiSecret,
    allowedOrigins: environment.allowedOrigins,
    allowLocalDevelopment: environment.allowLocalHttp,
  });
}
