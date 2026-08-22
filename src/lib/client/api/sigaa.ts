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
const succeededRunSchema = runSchema.extend({ status: z.literal("SUCCEEDED") }).strict();

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
      run: succeededRunSchema,
      synchronizedAt: isoDateSchema,
    })
    .strict(),
  z.object({ status: z.literal("replay"), run: succeededRunSchema }).strict(),
]);

const courseChangeMismatchSchema = z
  .object({
    message: z.string(),
    code: z.literal(ErrorCode.SIGAA_COURSE_MISMATCH),
    resolution: z.literal("confirmation_required"),
    proposalId: z.string().uuid(),
    expiresAt: isoDateSchema,
    currentCourse: z.string().min(1),
    sigaaCourse: z.string().min(1),
    targetCourse: z.string().min(1),
    currentCenter: z.string().min(1).optional(),
    targetCenter: z.string().min(1).optional(),
  })
  .strict();

const courseChangeInvalidSchema = z.discriminatedUnion("resolution", [
  z
    .object({
      message: z.string(),
      code: z.literal(ErrorCode.SIGAA_COURSE_MISMATCH),
      resolution: z.literal("blocked"),
      reason: z.enum([
        "source_missing",
        "source_unrecognized",
        "catalog_unavailable",
        "profile_changed",
      ]),
    })
    .strict(),
  z
    .object({
      message: z.string(),
      code: z.literal(ErrorCode.SIGAA_COURSE_MISMATCH),
      resolution: z.literal("stale"),
    })
    .strict(),
]);

const courseChangeConfirmationResponseSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("synchronized"),
      run: runSchema,
      synchronizedAt: isoDateSchema,
      courseReplaced: z.literal(true),
    })
    .strict(),
  z
    .object({
      status: z.literal("replay"),
      run: runSchema,
      courseReplaced: z.literal(true),
    })
    .strict(),
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
export type SigaaCourseChangeMismatch = z.infer<typeof courseChangeMismatchSchema>;
export type SigaaCourseChangeConfirmationResponse = z.infer<
  typeof courseChangeConfirmationResponseSchema
>;

export class SigaaCourseChangeRequiredError extends Error {
  readonly name = "SigaaCourseChangeRequiredError";

  constructor(readonly mismatch: SigaaCourseChangeMismatch) {
    super(mismatch.message);
  }
}

export class SigaaCourseChangeInvalidError extends Error {
  readonly name = "SigaaCourseChangeInvalidError";

  constructor(readonly resolution: z.infer<typeof courseChangeInvalidSchema>) {
    super(resolution.message);
  }
}

export type SigaaSyncInput = Readonly<{
  username: string;
  password: string;
  proofToken: string;
  idempotencyKey: string;
}>;

export type SigaaCourseChangeConfirmationInput = SigaaSyncInput & Readonly<{ proposalId: string }>;

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
  if (response.status === 409) {
    const body = await readJson(response);
    const mismatch = courseChangeMismatchSchema.safeParse(body);
    if (mismatch.success) {
      throw new SigaaCourseChangeRequiredError(mismatch.data);
    }
    await throwParsedApiError(response, body);
  }
  return parseResponse(response, syncResponseSchema);
}

export async function confirmOwnSigaaCourseChange(
  input: SigaaCourseChangeConfirmationInput
): Promise<SigaaCourseChangeConfirmationResponse> {
  const response = await sensitiveSigaaRequest(
    ENDPOINTS.SIGAA_COURSE_CHANGE_CONFIRM_ME,
    input.proofToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: input.proposalId,
        username: input.username,
        password: input.password,
        idempotencyKey: input.idempotencyKey,
        consentVersion: SIGAA_CONSENT_VERSION,
      }),
    }
  );
  if (response.status === 409) {
    const body = await readJson(response);
    const invalid = courseChangeInvalidSchema.safeParse(body);
    if (invalid.success) {
      throw new SigaaCourseChangeInvalidError(invalid.data);
    }
    await throwParsedApiError(response, body);
  }
  return parseResponse(response, courseChangeConfirmationResponseSchema);
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

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    throw invalidResponse(response.status);
  }
}

async function throwParsedApiError(response: Response, body: unknown): Promise<never> {
  const replay = new Response(JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  await throwApiError(replay);
  throw invalidResponse(response.status);
}
