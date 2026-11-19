import { z } from "zod";
import { uuidSchema } from "@/lib/shared/validations/uuid";

import { SIGAA_CONSENT_VERSION } from "@/lib/shared/sigaa/consent";

import { idempotencyKeySchema } from "@/lib/server/services/sigaa/storage.types";

export { SIGAA_CONSENT_VERSION };

export const sigaaReauthRequestSchema = z
  .object({
    password: z
      .string({
        error: issue => (issue.input === undefined ? "Senha do Aquário é obrigatória" : undefined),
      })
      .min(1, "Senha do Aquário é obrigatória")
      .max(128, "Senha do Aquário deve ter no máximo 128 caracteres"),
    proposalId: uuidSchema().optional(),
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
    proposalId: uuidSchema(),
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(256),
    idempotencyKey: idempotencyKeySchema,
    consentVersion: z.literal(SIGAA_CONSENT_VERSION),
  })
  .strict();

export type SigaaCourseChangeConfirmationRequest = z.infer<
  typeof sigaaCourseChangeConfirmationRequestSchema
>;
