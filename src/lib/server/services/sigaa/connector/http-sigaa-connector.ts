import "server-only";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

import {
  decodeFailureResponse,
  decodeSyncResponse,
  serializeSyncRequest,
} from "./connector-contract-v1";
import { isExplicitLoopbackHostname } from "./explicit-loopback-hostname";
import { SigaaConnectorError } from "./sigaa-connector.error";
import type { ISigaaConnector, SigaaSnapshotCandidate } from "./sigaa-connector.port";

export const SIGAA_CONNECTOR_TIMEOUT_MS = 165_000;
export const MAX_SIGAA_CONNECTOR_REQUEST_BYTES = 16 * 1024;
export const MAX_SIGAA_CONNECTOR_RESPONSE_BYTES = 16 * 1024 * 1024;

export type SigaaConnectorFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export type HttpSigaaConnectorOptions = Readonly<{
  connectorUrl: string;
  allowedOrigins: readonly string[];
  allowLocalDevelopment?: boolean;
  bearerToken: string;
  fetchImpl?: SigaaConnectorFetch;
  requestIdFactory?: () => string;
  timeoutSignalFactory?: (timeoutMs: number) => AbortSignal;
}>;

export class HttpSigaaConnector implements ISigaaConnector {
  readonly #connectorUrl: string;
  readonly #bearerToken: string;
  readonly #fetch: SigaaConnectorFetch;
  readonly #requestIdFactory: () => string;
  readonly #timeoutSignalFactory: (timeoutMs: number) => AbortSignal;

  constructor(options: HttpSigaaConnectorOptions) {
    this.#connectorUrl = parseConnectorUrl(
      options.connectorUrl,
      options.allowedOrigins,
      options.allowLocalDevelopment === true
    );
    this.#bearerToken = parseBearerToken(options.bearerToken);
    this.#fetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.#requestIdFactory = options.requestIdFactory ?? (() => randomUUID().replaceAll("-", ""));
    this.#timeoutSignalFactory =
      options.timeoutSignalFactory ?? AbortSignal.timeout.bind(AbortSignal);
  }

  async synchronize(input: {
    credentials: Parameters<ISigaaConnector["synchronize"]>[0]["credentials"];
    expectedMatricula: string | null;
  }): Promise<SigaaSnapshotCandidate> {
    const requestBody = input.credentials.useOnce(credentials =>
      serializeSyncRequest({ ...credentials, expectedMatricula: input.expectedMatricula })
    );
    if (new TextEncoder().encode(requestBody).byteLength > MAX_SIGAA_CONNECTOR_REQUEST_BYTES) {
      throw new TypeError("Invalid SIGAA connector request");
    }

    const requestId = this.#requestIdFactory();
    if (!/^[0-9a-f]{32}$/.test(requestId)) {
      throw new TypeError("Invalid SIGAA connector request ID");
    }

    const signal = this.#timeoutSignalFactory(SIGAA_CONNECTOR_TIMEOUT_MS);
    let response: Response;
    try {
      response = await this.#fetch(this.#connectorUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.#bearerToken}`,
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: requestBody,
        cache: "no-store",
        redirect: "error",
        signal,
      });
    } catch (error) {
      if (isDeadlineAbort(error, signal)) {
        throw new SigaaConnectorError("SIGAA_TIMEOUT");
      }
      throw new SigaaConnectorError("CONNECTOR_UNAVAILABLE");
    }

    const connectorRequestId = parseConnectorRequestId(response.headers.get("x-request-id"));
    if (!isJsonResponse(response)) {
      await cancelResponseBody(response);
      throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
    }

    let responseBody: string;
    try {
      responseBody = await readBoundedResponseBody(response, connectorRequestId);
    } catch (error) {
      if (error instanceof SigaaConnectorError) {
        throw error;
      }
      if (isDeadlineAbort(error, signal)) {
        throw new SigaaConnectorError("SIGAA_TIMEOUT", connectorRequestId);
      }
      throw new SigaaConnectorError("CONNECTOR_UNAVAILABLE", connectorRequestId);
    }

    if (response.status !== 200) {
      throw decodeFailureResponse(responseBody, response.status, connectorRequestId);
    }
    return decodeSyncResponse(responseBody, connectorRequestId);
  }
}

function parseConnectorUrl(
  value: string,
  allowedOriginValues: readonly string[],
  allowLocalDevelopment: boolean
): string {
  try {
    const url = new URL(value);
    const allowedOrigins = parseAllowedOrigins(allowedOriginValues, allowLocalDevelopment);
    if (
      url.username !== "" ||
      url.password !== "" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.pathname !== "/v1/sync" ||
      !isAllowedConnectorOrigin(url, allowLocalDevelopment) ||
      !allowedOrigins.has(url.origin)
    ) {
      throw new Error("invalid connector URL");
    }
    return url.toString();
  } catch {
    throw new TypeError("Invalid SIGAA connector configuration");
  }
}

function parseAllowedOrigins(
  values: readonly string[],
  allowLocalDevelopment: boolean
): ReadonlySet<string> {
  if (values.length === 0) {
    throw new Error("missing allowed connector origins");
  }

  const origins = new Set<string>();
  for (const value of values) {
    const url = new URL(value);
    if (
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      !isAllowedConnectorOrigin(url, allowLocalDevelopment)
    ) {
      throw new Error("invalid allowed connector origin");
    }
    origins.add(url.origin);
  }
  return origins;
}

function isAllowedConnectorOrigin(url: URL, allowLocalDevelopment: boolean): boolean {
  if (isExplicitLoopbackHostname(url.hostname)) {
    return (
      allowLocalDevelopment &&
      Reflect.get(process.env, "NODE_ENV") !== "production" &&
      url.protocol === "http:"
    );
  }

  return (
    url.protocol === "https:" &&
    url.port === "" &&
    isIP(stripIpv6Brackets(url.hostname)) === 0 &&
    url.hostname.includes(".") &&
    !url.hostname.endsWith(".localhost")
  );
}

function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function isDeadlineAbort(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted && isAbortLike(error) && isAbortLike(signal.reason);
}

function isAbortLike(value: unknown): boolean {
  if (typeof value !== "object" || value === null || !("name" in value)) {
    return false;
  }
  return value.name === "AbortError" || value.name === "TimeoutError";
}

function parseBearerToken(value: string): string {
  if (value.length < 32 || value.length > 512 || /\s/u.test(value)) {
    throw new TypeError("Invalid SIGAA connector configuration");
  }
  return value;
}

function parseConnectorRequestId(value: string | null): string {
  if (value === null || !/^[0-9a-f]{32}$/.test(value)) {
    throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID");
  }
  return value;
}

function isJsonResponse(response: Response): boolean {
  return response.headers.get("content-type")?.split(";", 1)[0].trim() === "application/json";
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cancellation is best-effort after the response has already been rejected.
  }
}

async function readBoundedResponseBody(
  response: Response,
  connectorRequestId: string
): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (
    contentLength !== null &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > MAX_SIGAA_CONNECTOR_RESPONSE_BYTES
  ) {
    await cancelResponseBody(response);
    throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
  }

  if (response.body === null) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      totalBytes += chunk.value.byteLength;
      if (totalBytes > MAX_SIGAA_CONNECTOR_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // Cancellation is best-effort after the response has already been rejected.
        }
        throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
  }
}
