import "server-only";

const SAFE_FAILURE_MESSAGES = {
  SIGAA_AUTH_FAILED: "SIGAA authentication failed.",
  SIGAA_IDENTITY_INVALID: "SIGAA returned an invalid account identity.",
  SIGAA_IDENTITY_MISMATCH: "The SIGAA account does not match the Aquario profile.",
  SIGAA_TIMEOUT: "SIGAA took too long to respond.",
  SIGAA_UNAVAILABLE: "SIGAA is temporarily unavailable.",
  SIGAA_RESPONSE_INVALID: "SIGAA returned an unsupported response.",
  CONNECTOR_UNAVAILABLE: "The SIGAA connector is unavailable.",
  CONNECTOR_MISCONFIGURED: "The SIGAA connector is misconfigured.",
} as const;

export type SigaaConnectorFailureCode = keyof typeof SAFE_FAILURE_MESSAGES;

export class SigaaConnectorError extends Error {
  readonly code: SigaaConnectorFailureCode;
  readonly connectorRequestId: string | undefined;

  constructor(code: SigaaConnectorFailureCode, connectorRequestId?: string) {
    super(SAFE_FAILURE_MESSAGES[code]);
    this.name = "SigaaConnectorError";
    this.code = code;
    this.connectorRequestId = connectorRequestId;
  }
}
