/**
 * @jest-environment node
 */
import {
  readSigaaConnectorEnvironment,
  readSigaaReauthEnvironment,
  readSigaaRetentionEnvironment,
  SIGAA_ENV_NAMES,
} from "../sigaa-env";

const REAUTH_SECRET = "reauth-secret-that-is-at-least-thirty-two-chars";
const CONNECTOR_SECRET = "connector-secret-that-is-at-least-thirty-two";
const CONNECTOR_ORIGIN = "https://sigaa-connector.example.com";

function connectorEnvironment(overrides: Record<string, string> = {}) {
  return {
    NODE_ENV: "production",
    [SIGAA_ENV_NAMES.connectorUrl]: `${CONNECTOR_ORIGIN}/v1/sync`,
    [SIGAA_ENV_NAMES.connectorApiSecret]: CONNECTOR_SECRET,
    [SIGAA_ENV_NAMES.connectorAllowedOrigins]: CONNECTOR_ORIGIN,
    ...overrides,
  };
}

describe("SIGAA server environment", () => {
  it("uses no browser-exposed environment prefix", () => {
    expect(Object.values(SIGAA_ENV_NAMES).every(name => !name.startsWith("NEXT_PUBLIC_"))).toBe(
      true
    );
  });

  it("reads only the named server values", () => {
    const environment = {
      [SIGAA_ENV_NAMES.reauthJwtSecret]: REAUTH_SECRET,
      ...connectorEnvironment(),
    };

    expect(readSigaaReauthEnvironment(environment)).toEqual({ jwtSecret: REAUTH_SECRET });
    expect(readSigaaConnectorEnvironment(environment)).toEqual({
      url: new URL(`${CONNECTOR_ORIGIN}/v1/sync`),
      apiSecret: CONNECTOR_SECRET,
      allowedOrigins: [CONNECTOR_ORIGIN],
      allowLocalHttp: false,
    });
  });

  it("rejects missing, short, and reused reauthentication secrets without including values", () => {
    expect(() => readSigaaReauthEnvironment({})).toThrow("SIGAA_REAUTH_JWT_SECRET");
    expect(() =>
      readSigaaReauthEnvironment({ [SIGAA_ENV_NAMES.reauthJwtSecret]: "short" })
    ).toThrow("SIGAA_REAUTH_JWT_SECRET");
    expect(() =>
      readSigaaReauthEnvironment({
        [SIGAA_ENV_NAMES.reauthJwtSecret]: REAUTH_SECRET,
        JWT_SECRET: REAUTH_SECRET,
      })
    ).toThrow("must differ from JWT_SECRET");

    try {
      readSigaaReauthEnvironment({ [SIGAA_ENV_NAMES.reauthJwtSecret]: "secret-value" });
    } catch (error) {
      expect(String(error)).not.toContain("secret-value");
    }
  });

  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "allows local HTTP for %s only behind the explicit development flag",
    hostname => {
      const origin = `http://${hostname}:8000`;
      expect(
        readSigaaConnectorEnvironment(
          connectorEnvironment({
            NODE_ENV: "development",
            [SIGAA_ENV_NAMES.connectorUrl]: `${origin}/v1/sync`,
            [SIGAA_ENV_NAMES.connectorAllowedOrigins]: origin,
            [SIGAA_ENV_NAMES.connectorAllowLocalHttp]: "true",
          })
        ).url.href
      ).toBe(`${origin}/v1/sync`);
      expect(() =>
        readSigaaConnectorEnvironment(
          connectorEnvironment({
            NODE_ENV: "development",
            [SIGAA_ENV_NAMES.connectorUrl]: "http://localhost:8000/v1/sync",
            [SIGAA_ENV_NAMES.connectorAllowedOrigins]: "http://localhost:8000",
          })
        )
      ).toThrow("must use HTTPS");
      expect(() =>
        readSigaaConnectorEnvironment(
          connectorEnvironment({
            [SIGAA_ENV_NAMES.connectorUrl]: "http://localhost:8000/v1/sync",
            [SIGAA_ENV_NAMES.connectorAllowedOrigins]: "http://localhost:8000",
            [SIGAA_ENV_NAMES.connectorAllowLocalHttp]: "true",
          })
        )
      ).toThrow("allowed only in development");
    }
  );

  it("requires the exact /v1/sync URL and an exact origin allowlist match", () => {
    expect(() =>
      readSigaaConnectorEnvironment(
        connectorEnvironment({
          [SIGAA_ENV_NAMES.connectorUrl]: `${CONNECTOR_ORIGIN}/health`,
        })
      )
    ).toThrow("exact /v1/sync endpoint");
    expect(() =>
      readSigaaConnectorEnvironment(
        connectorEnvironment({
          [SIGAA_ENV_NAMES.connectorUrl]: `${CONNECTOR_ORIGIN}/v1/sync?debug=true`,
        })
      )
    ).toThrow("exact /v1/sync endpoint");
    expect(() =>
      readSigaaConnectorEnvironment(
        connectorEnvironment({
          [SIGAA_ENV_NAMES.connectorAllowedOrigins]: "https://other.example.com",
        })
      )
    ).toThrow("origin is not allowed");
    expect(() =>
      readSigaaConnectorEnvironment(
        connectorEnvironment({
          [SIGAA_ENV_NAMES.connectorAllowedOrigins]: `${CONNECTOR_ORIGIN}/`,
        })
      )
    ).toThrow("canonical origins only");
  });

  it("rejects invalid local flags without echoing URLs or secrets", () => {
    expect(() =>
      readSigaaConnectorEnvironment(
        connectorEnvironment({ [SIGAA_ENV_NAMES.connectorAllowLocalHttp]: "yes" })
      )
    ).toThrow("must be true or false");

    const privateOrigin = "https://private-tenant.example.com";

    try {
      readSigaaConnectorEnvironment(
        connectorEnvironment({
          [SIGAA_ENV_NAMES.connectorAllowedOrigins]: privateOrigin,
        })
      );
    } catch (error) {
      expect(String(error)).not.toContain(privateOrigin);
      expect(String(error)).not.toContain(CONNECTOR_SECRET);
    }
  });

  it("keeps the ordinary JWT, reauthentication JWT, and connector bearer distinct", () => {
    expect(() =>
      readSigaaReauthEnvironment({
        [SIGAA_ENV_NAMES.reauthJwtSecret]: REAUTH_SECRET,
        [SIGAA_ENV_NAMES.connectorApiSecret]: REAUTH_SECRET,
      })
    ).toThrow("must differ from SIGAA_CONNECTOR_API_SECRET");
    expect(() =>
      readSigaaConnectorEnvironment({
        ...connectorEnvironment(),
        JWT_SECRET: CONNECTOR_SECRET,
      })
    ).toThrow("must be unique");
    expect(() =>
      readSigaaReauthEnvironment({
        [SIGAA_ENV_NAMES.reauthJwtSecret]: REAUTH_SECRET,
        [SIGAA_ENV_NAMES.cronSecret]: REAUTH_SECRET,
      })
    ).toThrow("must differ from CRON_SECRET");
    expect(() =>
      readSigaaConnectorEnvironment({
        ...connectorEnvironment(),
        [SIGAA_ENV_NAMES.cronSecret]: CONNECTOR_SECRET,
      })
    ).toThrow("must be unique");
  });

  it("requires a distinct retention cron secret", () => {
    const cronSecret = "cron-secret-that-is-at-least-thirty-two-chars";

    expect(readSigaaRetentionEnvironment({ [SIGAA_ENV_NAMES.cronSecret]: cronSecret })).toEqual({
      cronSecret,
    });
    expect(() => readSigaaRetentionEnvironment({})).toThrow("CRON_SECRET");
    expect(() =>
      readSigaaRetentionEnvironment({
        [SIGAA_ENV_NAMES.cronSecret]: cronSecret,
        [SIGAA_ENV_NAMES.connectorApiSecret]: cronSecret,
      })
    ).toThrow("CRON_SECRET must be unique");
  });

  it("fails closed in public previews while permitting explicitly isolated staging", () => {
    expect(() =>
      readSigaaConnectorEnvironment(connectorEnvironment({ VERCEL_ENV: "preview" }))
    ).toThrow("disabled in preview deployments");

    expect(
      readSigaaConnectorEnvironment(
        connectorEnvironment({ VERCEL_ENV: "preview", NEXT_PUBLIC_IS_STAGING: "true" })
      ).url.origin
    ).toBe(CONNECTOR_ORIGIN);
  });
});
