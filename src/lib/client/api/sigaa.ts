import { z } from "zod";

import { ApiError, ErrorCode, throwApiError } from "@/lib/client/errors/api-error";
import { API_URL, ENDPOINTS } from "@/lib/shared/config/constants";

import { tokenManager } from "./token-manager";

export const SIGAA_CONSENT_VERSION = "sigaa-v1-2026-08";

const runSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(["RUNNING", "SUCCEEDED", "FAILED", "SUPERSEDED"]),
    failureCode: z.string().nullable(),
    connectorRequestId: z.string().nullable(),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().nullable(),
  })
  .strict();

const syncResponseSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("synchronized"),
      run: runSchema,
      synchronizedAt: z.string().datetime(),
    })
    .strict(),
  z.object({ status: z.literal("replay"), run: runSchema }).strict(),
]);

export type SigaaSyncResponse = z.infer<typeof syncResponseSchema>;

export type SigaaSyncInput = Readonly<{
  username: string;
  password: string;
  proofToken: string;
  idempotencyKey: string;
}>;

export async function synchronizeOwnSigaa(input: SigaaSyncInput): Promise<SigaaSyncResponse> {
  const token = tokenManager.getToken();
  if (!token) {
    throw new ApiError("Token não fornecido", ErrorCode.TOKEN_MISSING, undefined, 401);
  }

  const response = await fetch(`${API_URL}${ENDPOINTS.SIGAA_SYNC_ME}`, {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "X-Sigaa-Reauth-Token": input.proofToken,
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      idempotencyKey: input.idempotencyKey,
      consentVersion: SIGAA_CONSENT_VERSION,
    }),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw invalidResponse(response.status);
  }

  const parsed = syncResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw invalidResponse(response.status);
  }
  return parsed.data;
}

function invalidResponse(status: number): ApiError {
  return new ApiError(
    "Resposta de sincronização SIGAA inválida",
    ErrorCode.INTERNAL_ERROR,
    undefined,
    status
  );
}
