import { z } from "zod";

import { ApiError, ErrorCode, throwApiError } from "@/lib/client/errors/api-error";
import { API_URL, ENDPOINTS } from "@/lib/shared/config/constants";

import { tokenManager } from "./token-manager";

const sigaaReauthResponseSchema = z
  .object({
    proofToken: z.string().min(1),
    expiresAt: z.string().datetime(),
  })
  .strict();

export type SigaaReauthResponse = z.infer<typeof sigaaReauthResponseSchema>;

export async function reauthenticateForSigaa(password: string): Promise<SigaaReauthResponse> {
  const token = tokenManager.getToken();

  if (!token) {
    throw new ApiError("Token não fornecido", ErrorCode.TOKEN_MISSING, undefined, 401);
  }

  const response = await fetch(`${API_URL}${ENDPOINTS.SIGAA_REAUTH_ME}`, {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const parsed = sigaaReauthResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new ApiError(
      "Resposta de reautenticação inválida",
      ErrorCode.INTERNAL_ERROR,
      undefined,
      response.status
    );
  }

  return parsed.data;
}
