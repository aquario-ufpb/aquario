import { z } from "zod";

import { ApiError, ErrorCode, throwApiError } from "@/lib/client/errors/api-error";
import { API_URL, ENDPOINTS } from "@/lib/shared/config/constants";
import { sigaaAcademicSnapshotPayloadSchema } from "@/lib/shared/types/sigaa-academic";

import { apiClient } from "./api-client";
import { tokenManager } from "./token-manager";

export const SIGAA_CONSENT_VERSION = "sigaa-v1-2026-08";

const isoDateSchema = z.string().datetime();
const runSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["RUNNING", "SUCCEEDED", "FAILED", "SUPERSEDED"]),
    failureCode: z.string().nullable(),
    connectorRequestId: z.string().nullable(),
    startedAt: isoDateSchema,
    finishedAt: isoDateSchema.nullable(),
  })
  .strict();

const importedStateSchema = z
  .object({
    matricula: z
      .object({
        value: z.string().nullable(),
        origin: z.enum(["LEGACY", "MANUAL", "SIGAA"]).nullable(),
        verifiedAt: isoDateSchema.nullable(),
      })
      .strict(),
    connection: z
      .object({
        status: z.enum(["PENDING", "CONNECTED", "DISCONNECTED"]),
        consentVersion: z.string().nullable(),
        consentedAt: isoDateSchema.nullable(),
        connectedAt: isoDateSchema.nullable(),
        disconnectedAt: isoDateSchema.nullable(),
      })
      .strict()
      .nullable(),
    snapshot: z
      .object({
        contractVersion: z.string(),
        connectorObservedAt: isoDateSchema,
        synchronizedAt: isoDateSchema,
        upstreamCommit: z.string().regex(/^[0-9a-f]{40}$/),
        installedByRunId: z.string().nullable(),
        payload: sigaaAcademicSnapshotPayloadSchema,
      })
      .strict()
      .nullable(),
  })
  .strict();

const syncResponseSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("synchronized"),
      run: runSchema,
      synchronizedAt: isoDateSchema,
    })
    .strict(),
  z.object({ status: z.literal("replay"), run: runSchema }).strict(),
]);

const disconnectResponseSchema = z
  .object({ status: z.literal("disconnected"), disconnectedAt: isoDateSchema })
  .strict();

const deleteResponseSchema = z
  .object({
    status: z.literal("deleted"),
    hadImportedData: z.boolean(),
    matriculaCleared: z.boolean(),
  })
  .strict();

export type SigaaImportedState = z.infer<typeof importedStateSchema>;
export type SigaaSyncResponse = z.infer<typeof syncResponseSchema>;

export type SigaaSyncInput = Readonly<{
  username: string;
  password: string;
  proofToken: string;
  idempotencyKey: string;
}>;

async function parseResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok) {
    await throwApiError(response);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw invalidResponse(response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw invalidResponse(response.status);
  }
  return parsed.data;
}

function sensitiveSigaaRequest(endpoint: string, proofToken: string, init: RequestInit) {
  const token = tokenManager.getToken();
  if (!token) {
    throw new ApiError("Token não fornecido", ErrorCode.TOKEN_MISSING, undefined, 401);
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...init,
    cache: "no-store",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
      "X-Sigaa-Reauth-Token": proofToken,
      ...init.headers,
    },
  });
}

export async function getOwnSigaaAcademicState(): Promise<SigaaImportedState> {
  const response = await apiClient(ENDPOINTS.SIGAA_ACADEMIC_ME, {
    method: "GET",
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });
  return parseResponse(response, importedStateSchema);
}

export async function synchronizeOwnSigaa(input: SigaaSyncInput): Promise<SigaaSyncResponse> {
  const response = await sensitiveSigaaRequest(ENDPOINTS.SIGAA_SYNC_ME, input.proofToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      idempotencyKey: input.idempotencyKey,
      consentVersion: SIGAA_CONSENT_VERSION,
    }),
  });
  return parseResponse(response, syncResponseSchema);
}

export async function disconnectOwnSigaa(proofToken: string) {
  const response = await sensitiveSigaaRequest(ENDPOINTS.SIGAA_DISCONNECT_ME, proofToken, {
    method: "POST",
  });
  return parseResponse(response, disconnectResponseSchema);
}

export async function deleteOwnSigaaData(proofToken: string) {
  const response = await sensitiveSigaaRequest(ENDPOINTS.SIGAA_DATA_ME, proofToken, {
    method: "DELETE",
  });
  return parseResponse(response, deleteResponseSchema);
}

function invalidResponse(status: number): ApiError {
  return new ApiError("Resposta SIGAA inválida", ErrorCode.INTERNAL_ERROR, undefined, status);
}
