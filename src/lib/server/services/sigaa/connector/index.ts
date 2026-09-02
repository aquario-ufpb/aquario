import "server-only";

export { EphemeralSigaaCredentials } from "./ephemeral-credentials";
export {
  HttpSigaaConnector,
  MAX_SIGAA_CONNECTOR_REQUEST_BYTES,
  MAX_SIGAA_CONNECTOR_RESPONSE_BYTES,
  SIGAA_CONNECTOR_TIMEOUT_MS,
  type HttpSigaaConnectorOptions,
  type SigaaConnectorFetch,
} from "./http-sigaa-connector";
export { SigaaConnectorError, type SigaaConnectorFailureCode } from "./sigaa-connector.error";
export type {
  ISigaaConnector,
  SigaaAcademicComponent,
  SigaaClass,
  SigaaComponentStatus,
  SigaaGrade,
  SigaaSnapshotCandidate,
  SigaaWorkloadProgress,
} from "./sigaa-connector.port";
