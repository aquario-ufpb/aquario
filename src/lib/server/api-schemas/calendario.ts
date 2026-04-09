import { z } from "zod";

import { ALL_CATEGORIAS } from "@/lib/shared/config/calendario-academico";

/**
 * Zod request schemas for the /api/calendario-academico/* endpoints.
 *
 * See src/lib/server/api-schemas/auth.ts for the rationale on why these
 * live outside of the route.ts files (Next.js 15 route export restrictions).
 */

/**
 * Required ISO date string — used by the create schemas where dates are
 * mandatory. Rejects empty strings and anything that can't be parsed by
 * `new Date()`.
 */
const requiredDateString = z
  .string()
  .min(1, "Data é obrigatória")
  .refine(s => !isNaN(new Date(s).getTime()), { message: "Data inválida" });

/**
 * Optional ISO date string — used by the patch schemas where dates are
 * optional but must still be valid when provided.
 */
const optionalDateString = z
  .string()
  .refine(s => !isNaN(new Date(s).getTime()), { message: "Data inválida" });

// ---------------------------------------------------------------------------
// Semesters
// ---------------------------------------------------------------------------

export const createSemestreSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dataInicio: requiredDateString,
  dataFim: requiredDateString,
});

export const updateSemestreSchema = z.object({
  nome: z.string().min(1).optional(),
  dataInicio: optionalDateString.optional(),
  dataFim: optionalDateString.optional(),
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const createEventoSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  dataInicio: requiredDateString,
  dataFim: requiredDateString,
  categoria: z.enum(ALL_CATEGORIAS).default("OUTRA"),
});

export const updateEventoSchema = z.object({
  descricao: z.string().min(1).optional(),
  dataInicio: optionalDateString.optional(),
  dataFim: optionalDateString.optional(),
  categoria: z.enum(ALL_CATEGORIAS).optional(),
});

export const batchCreateSchema = z.object({
  eventos: z.array(
    z.object({
      descricao: z.string().min(1),
      dataInicio: requiredDateString,
      dataFim: requiredDateString,
      categoria: z.enum(ALL_CATEGORIAS).default("OUTRA"),
    })
  ),
  replace: z.boolean().default(false),
});
