import { z } from "zod";

import { idempotencyKeySchema } from "@/lib/server/services/sigaa/storage.types";

export const SIGAA_CONSENT_VERSION = "sigaa-v1-2026-08";

export const sigaaReauthRequestSchema = z
  .object({
    password: z
      .string({ required_error: "Senha do Aquário é obrigatória" })
      .min(1, "Senha do Aquário é obrigatória")
      .max(128, "Senha do Aquário deve ter no máximo 128 caracteres"),
    proposalId: z.string().uuid().optional(),
  })
  .strict();

export type SigaaReauthRequest = z.infer<typeof sigaaReauthRequestSchema>;

export const sigaaSyncRequestSchema = z
  .object({
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(256),
    idempotencyKey: idempotencyKeySchema,
    consentVersion: z.literal(SIGAA_CONSENT_VERSION),
  })
  .strict();

export type SigaaSyncRequest = z.infer<typeof sigaaSyncRequestSchema>;

export const sigaaCourseChangeConfirmationRequestSchema = z
  .object({
    proposalId: z.string().uuid(),
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(256),
    idempotencyKey: idempotencyKeySchema,
    consentVersion: z.literal(SIGAA_CONSENT_VERSION),
  })
  .strict();

export type SigaaCourseChangeConfirmationRequest = z.infer<
  typeof sigaaCourseChangeConfirmationRequestSchema
>;
