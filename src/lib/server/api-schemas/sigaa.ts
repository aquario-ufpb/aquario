import { z } from "zod";

export const sigaaReauthRequestSchema = z
  .object({
    password: z
      .string({ required_error: "Senha do Aquário é obrigatória" })
      .min(1, "Senha do Aquário é obrigatória")
      .max(128, "Senha do Aquário deve ter no máximo 128 caracteres"),
  })
  .strict();

export type SigaaReauthRequest = z.infer<typeof sigaaReauthRequestSchema>;
