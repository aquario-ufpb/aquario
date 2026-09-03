/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import path from "node:path";

import * as connectorBoundary from "../index";
import { EphemeralSigaaCredentials } from "../ephemeral-credentials";
import {
  HttpSigaaConnector,
  MAX_SIGAA_CONNECTOR_RESPONSE_BYTES,
  SIGAA_CONNECTOR_TIMEOUT_MS,
  type SigaaConnectorFetch,
} from "../http-sigaa-connector";
import { SigaaConnectorError } from "../sigaa-connector.error";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "sync-response-v1.json");
const CONNECTOR_URL = "https://connector.example.test/v1/sync";
const CONNECTOR_ORIGIN = "https://connector.example.test";
const BEARER_TOKEN = "s".repeat(32);
const OUTBOUND_REQUEST_ID = "b".repeat(32);
const CONNECTOR_REQUEST_ID = "a".repeat(32);

function fixtureBody(): string {
  return fs.readFileSync(FIXTURE_PATH, "utf8");
}

function jsonResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": CONNECTOR_REQUEST_ID,
      ...headers,
    },
  });
}

function credentials(): EphemeralSigaaCredentials {
  return EphemeralSigaaCredentials.parse({
    username: "20260000001",
    password: "private-password",
  });
}

function createConnector(fetchImpl: SigaaConnectorFetch) {
  const timeoutSignal = new AbortController().signal;
  const timeoutSignalFactory = jest.fn((_timeoutMs: number) => timeoutSignal);
  const connector = new HttpSigaaConnector({
    connectorUrl: CONNECTOR_URL,
    allowedOrigins: [CONNECTOR_ORIGIN],
    bearerToken: BEARER_TOKEN,
    fetchImpl,
    requestIdFactory: () => OUTBOUND_REQUEST_ID,
    timeoutSignalFactory,
  });
  return { connector, timeoutSignal, timeoutSignalFactory };
}

async function expectConnectorFailure(
  operation: Promise<unknown>,
  code: SigaaConnectorError["code"]
): Promise<SigaaConnectorError> {
  try {
    await operation;
    throw new Error("Expected connector failure");
  } catch (error) {
    expect(error).toBeInstanceOf(SigaaConnectorError);
    expect((error as SigaaConnectorError).code).toBe(code);
    return error as SigaaConnectorError;
  }
}

describe("EphemeralSigaaCredentials", () => {
  it("is opaque, non-serializable, and consumable only once", () => {
    const value = credentials();

    expect(Object.keys(value)).toEqual([]);
    expect(value).not.toHaveProperty("username");
    expect(value).not.toHaveProperty("password");
    expect(() => JSON.stringify(value)).toThrow("SIGAA credentials are not serializable");
    expect(value.useOnce(credentialsValue => credentialsValue.username)).toBe("20260000001");
    expect(() => value.useOnce(() => undefined)).toThrow("already consumed");
  });

  it("rejects extra fields and bounded credential violations without echoing values", () => {
    const secret = "p".repeat(257);

    expect(() =>
      EphemeralSigaaCredentials.parse({
        username: "20260000001",
        password: secret,
        persist: true,
      })
    ).toThrow("Invalid SIGAA credentials");

    try {
      EphemeralSigaaCredentials.parse({ username: "20260000001", password: secret });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});

describe("SIGAA connector server barrel", () => {
  it("does not export wire parsers or schemas", () => {
    expect(connectorBoundary).not.toHaveProperty("decodeSyncResponse");
    expect(connectorBoundary).not.toHaveProperty("decodeFailureResponse");
    expect(connectorBoundary).not.toHaveProperty("serializeSyncRequest");
  });
});

describe("HttpSigaaConnector", () => {
  it("performs one fixed no-store bearer request with a 165 second deadline", async () => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(jsonResponse(fixtureBody()));
    const { connector, timeoutSignal, timeoutSignalFactory } = createConnector(fetchImpl);

    const candidate = await connector.synchronize({
      credentials: credentials(),
      expectedMatricula: null,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(timeoutSignalFactory).toHaveBeenCalledWith(SIGAA_CONNECTOR_TIMEOUT_MS);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(CONNECTOR_URL);
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      redirect: "error",
      signal: timeoutSignal,
    });
    const headers = new Headers(init?.headers);
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe(`Bearer ${BEARER_TOKEN}`);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-request-id")).toBe(OUTBOUND_REQUEST_ID);
    expect(JSON.parse(String(init?.body))).toEqual({
      username: "20260000001",
      password: "private-password",
      expected_matricula: null,
    });
    expect(candidate.connectorRequestId).toBe(CONNECTOR_REQUEST_ID);
  });

  it("does not replay a failed request", async () => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockRejectedValue(new Error("network detail"));
    const { connector } = createConnector(fetchImpl);

    const error = await expectConnectorFailure(
      connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
      "CONNECTOR_UNAVAILABLE"
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(error.message).not.toContain("network detail");
  });

  it.each(["AbortError", "TimeoutError"])(
    "maps a deadline-caused %s to SIGAA_TIMEOUT without retaining its cause",
    async errorName => {
      const deadlineController = new AbortController();
      const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(
        (_url, init) => {
          return new Promise((_resolve, reject) => {
            const signal = init?.signal;
            const rejectFromDeadline = () => reject(signal?.reason);
            if (signal?.aborted) {
              rejectFromDeadline();
              return;
            }
            signal?.addEventListener("abort", rejectFromDeadline, { once: true });
          });
        }
      );
      const timeoutSignalFactory = jest.fn((_timeoutMs: number) => deadlineController.signal);
      const connector = new HttpSigaaConnector({
        connectorUrl: CONNECTOR_URL,
        allowedOrigins: [CONNECTOR_ORIGIN],
        bearerToken: BEARER_TOKEN,
        fetchImpl,
        requestIdFactory: () => OUTBOUND_REQUEST_ID,
        timeoutSignalFactory,
      });
      const operation = connector.synchronize({
        credentials: credentials(),
        expectedMatricula: null,
      });
      const rawCause = `private ${errorName} detail`;

      deadlineController.abort(new DOMException(rawCause, errorName));
      const error = await expectConnectorFailure(operation, "SIGAA_TIMEOUT");

      expect(timeoutSignalFactory).toHaveBeenCalledWith(SIGAA_CONNECTOR_TIMEOUT_MS);
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(Object.prototype.hasOwnProperty.call(error, "cause")).toBe(false);
      expect(error.message).not.toContain(rawCause);
      expect(JSON.stringify(error)).not.toContain(rawCause);
    }
  );

  it.each(["AbortError", "TimeoutError"])(
    "keeps an external %s rejection as CONNECTOR_UNAVAILABLE",
    async errorName => {
      const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
      fetchImpl.mockRejectedValue(new DOMException("external failure", errorName));
      const { connector } = createConnector(fetchImpl);

      await expectConnectorFailure(
        connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
        "CONNECTOR_UNAVAILABLE"
      );
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  );

  it("does not reuse credentials for a second connector request", async () => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(jsonResponse(fixtureBody()));
    const { connector } = createConnector(fetchImpl);
    const value = credentials();

    await connector.synchronize({ credentials: value, expectedMatricula: null });

    await expect(
      connector.synchronize({ credentials: value, expectedMatricula: null })
    ).rejects.toThrow("already consumed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    [401, "SIGAA_AUTH_FAILED", "SIGAA_AUTH_FAILED"],
    [401, "UNAUTHORIZED", "CONNECTOR_MISCONFIGURED"],
    [504, "CONNECTOR_DEADLINE", "SIGAA_TIMEOUT"],
    [500, "INTERNAL_ERROR", "CONNECTOR_UNAVAILABLE"],
  ] as const)(
    "maps HTTP %s and %s through the closed failure table",
    async (status, wireCode, code) => {
      const rawMessage = "private upstream detail";
      const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
      fetchImpl.mockResolvedValue(
        jsonResponse(JSON.stringify({ error: { code: wireCode, message: rawMessage } }), status)
      );
      const { connector } = createConnector(fetchImpl);

      const error = await expectConnectorFailure(
        connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
        code
      );

      expect(error.message).not.toContain(rawMessage);
      expect(JSON.stringify(error)).not.toContain(rawMessage);
      expect(error.connectorRequestId).toBe(CONNECTOR_REQUEST_ID);
    }
  );

  it.each([
    [503, { error: { code: "SIGAA_AUTH_FAILED", message: "wrong status" } }],
    [502, { error: { code: "NEW_FAILURE", message: "unknown code" } }],
    [502, { error: { code: "SIGAA_RESPONSE_INVALID", message: "known", extra: true } }],
  ])("fails closed for an invalid error response", async (status, body) => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(jsonResponse(JSON.stringify(body), status));
    const { connector } = createConnector(fetchImpl);

    await expectConnectorFailure(
      connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
      "SIGAA_RESPONSE_INVALID"
    );
  });

  it("rejects an oversized response before JSON parsing", async () => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(
      jsonResponse("{}", 200, {
        "content-length": String(MAX_SIGAA_CONNECTOR_RESPONSE_BYTES + 1),
      })
    );
    const { connector } = createConnector(fetchImpl);

    await expectConnectorFailure(
      connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
      "SIGAA_RESPONSE_INVALID"
    );
  });

  it("stops reading a streamed response after the byte limit", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_SIGAA_CONNECTOR_RESPONSE_BYTES + 1));
        controller.close();
      },
    });
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-request-id": CONNECTOR_REQUEST_ID,
        },
      })
    );
    const { connector } = createConnector(fetchImpl);

    await expectConnectorFailure(
      connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
      "SIGAA_RESPONSE_INVALID"
    );
  });

  it("maps a deadline abort while reading a pending response stream to SIGAA_TIMEOUT", async () => {
    const deadlineController = new AbortController();
    const rawCause = "private post-header timeout detail";
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(
      (_url, init) => {
        const signal = init?.signal;
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            signal?.addEventListener("abort", () => controller.error(signal.reason), {
              once: true,
            });
          },
        });
        return Promise.resolve(
          new Response(body, {
            status: 200,
            headers: {
              "content-type": "application/json",
              "x-request-id": CONNECTOR_REQUEST_ID,
            },
          })
        );
      }
    );
    const connector = new HttpSigaaConnector({
      connectorUrl: CONNECTOR_URL,
      allowedOrigins: [CONNECTOR_ORIGIN],
      bearerToken: BEARER_TOKEN,
      fetchImpl,
      requestIdFactory: () => OUTBOUND_REQUEST_ID,
      timeoutSignalFactory: () => deadlineController.signal,
    });
    const operation = connector.synchronize({
      credentials: credentials(),
      expectedMatricula: null,
    });

    deadlineController.abort(new DOMException(rawCause, "TimeoutError"));
    const error = await expectConnectorFailure(operation, "SIGAA_TIMEOUT");

    expect(error.connectorRequestId).toBe(CONNECTOR_REQUEST_ID);
    expect(Object.prototype.hasOwnProperty.call(error, "cause")).toBe(false);
    expect(error.message).not.toContain(rawCause);
    expect(JSON.stringify(error)).not.toContain(rawCause);
  });

  it.each([
    new Response(fixtureBody(), {
      status: 200,
      headers: { "content-type": "text/plain", "x-request-id": CONNECTOR_REQUEST_ID },
    }),
    new Response(fixtureBody(), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
    jsonResponse(JSON.stringify({ ...JSON.parse(fixtureBody()), extra: true })),
  ])("rejects malformed success boundaries", async response => {
    const fetchImpl = jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>();
    fetchImpl.mockResolvedValue(response);
    const { connector } = createConnector(fetchImpl);

    await expectConnectorFailure(
      connector.synchronize({ credentials: credentials(), expectedMatricula: null }),
      "SIGAA_RESPONSE_INVALID"
    );
  });

  it.each([
    ["http://connector.example.test/v1/sync", BEARER_TOKEN],
    ["https://connector.example.test/other", BEARER_TOKEN],
    ["https://connector.example.test/v1/sync?target=other", BEARER_TOKEN],
    [CONNECTOR_URL, "short"],
  ])("rejects unsafe fixed configuration", (connectorUrl, bearerToken) => {
    expect(
      () =>
        new HttpSigaaConnector({
          connectorUrl,
          allowedOrigins: [CONNECTOR_ORIGIN],
          bearerToken,
          fetchImpl: jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(),
        })
    ).toThrow("Invalid SIGAA connector configuration");
  });

  it.each([
    ["https://public.example.test/v1/sync", [CONNECTOR_ORIGIN]],
    ["https://connector.example.test:8443/v1/sync", ["https://connector.example.test:8443"]],
    ["https://8.8.8.8/v1/sync", ["https://8.8.8.8"]],
    ["https://10.0.0.1/v1/sync", ["https://10.0.0.1"]],
    ["https://127.0.0.1/v1/sync", ["https://127.0.0.1"]],
    ["https://169.254.1.1/v1/sync", ["https://169.254.1.1"]],
    ["https://[::1]/v1/sync", ["https://[::1]"]],
    [CONNECTOR_URL, ["https://connector.example.test.evil"]],
  ])(
    "rejects a connector destination outside the explicit public-origin policy",
    (url, allowedOrigins) => {
      expect(
        () =>
          new HttpSigaaConnector({
            connectorUrl: url,
            allowedOrigins,
            bearerToken: BEARER_TOKEN,
            fetchImpl: jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(),
          })
      ).toThrow("Invalid SIGAA connector configuration");
    }
  );

  it.each(["http://localhost:8787", "http://127.0.0.1:8787", "http://[::1]:8787"])(
    "allows explicit local development origin %s outside production",
    origin => {
      expect(
        new HttpSigaaConnector({
          connectorUrl: `${origin}/v1/sync`,
          allowedOrigins: [origin],
          allowLocalDevelopment: true,
          bearerToken: BEARER_TOKEN,
          fetchImpl: jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(),
        })
      ).toBeInstanceOf(HttpSigaaConnector);
    }
  );

  it("rejects a local origin without the explicit local-development option", () => {
    expect(
      () =>
        new HttpSigaaConnector({
          connectorUrl: "http://127.0.0.1:8787/v1/sync",
          allowedOrigins: ["http://127.0.0.1:8787"],
          bearerToken: BEARER_TOKEN,
          fetchImpl: jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(),
        })
    ).toThrow("Invalid SIGAA connector configuration");
  });

  it("rejects local mode in production even when explicitly requested", () => {
    const originalProcessEnvDescriptor = Object.getOwnPropertyDescriptor(process, "env");
    if (!originalProcessEnvDescriptor) {
      throw new Error("Expected process.env to have a property descriptor");
    }
    Object.defineProperty(process, "env", {
      configurable: true,
      enumerable: true,
      value: { ...process.env, NODE_ENV: "production" },
      writable: true,
    });
    try {
      expect(
        () =>
          new HttpSigaaConnector({
            connectorUrl: "http://localhost:8787/v1/sync",
            allowedOrigins: ["http://localhost:8787"],
            allowLocalDevelopment: true,
            bearerToken: BEARER_TOKEN,
            fetchImpl: jest.fn<ReturnType<SigaaConnectorFetch>, Parameters<SigaaConnectorFetch>>(),
          })
      ).toThrow("Invalid SIGAA connector configuration");
    } finally {
      Object.defineProperty(process, "env", originalProcessEnvDescriptor);
    }
  });
});
