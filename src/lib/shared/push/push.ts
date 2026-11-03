import { z } from "zod";

/** Categorias opcionais de notificação; todas começam desligadas (consentimento explícito). */
export const PUSH_CATEGORIAS = ["prazos", "vagas", "entidades"] as const;
export type PushCategoria = (typeof PUSH_CATEGORIAS)[number];

export type PushPreferencias = Record<PushCategoria, boolean>;

/** Formato do token do Expo Push Service. */
export const expoPushTokenSchema = z
  .string()
  .max(256)
  .regex(/^Expo(nent)?PushToken\[[^\]\s]+\]$/, "Token de push inválido");

export const registrarDispositivoSchema = z.object({
  token: expoPushTokenSchema,
  plataforma: z.enum(["android", "ios"]),
  preferencias: z.object({
    prazos: z.boolean(),
    vagas: z.boolean(),
    entidades: z.boolean(),
  }),
});

export type RegistrarDispositivo = z.infer<typeof registrarDispositivoSchema>;
