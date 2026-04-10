import { z } from "zod";

/**
 * Zod request schemas for the /api/entidades/* endpoints.
 *
 * See src/lib/server/api-schemas/auth.ts for the rationale on why these
 * live outside of the route.ts files (Next.js 15 route export restrictions).
 */

/** Schema de validação para atualização de entidade. */
export const updateEntidadeSchema = z.object({
  nome: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: z
    .enum([
      "LABORATORIO",
      "GRUPO",
      "LIGA_ACADEMICA",
      "EMPRESA",
      "ATLETICA",
      "CENTRO_ACADEMICO",
      "OUTRO",
    ])
    .optional(),
  urlFoto: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  foundingDate: z.string().nullable().optional(),
  slug: z.string().optional(),
});

/** Schema de validação para adição de membro a uma entidade. */
export const addMemberSchema = z.object({
  usuarioId: z.string().uuid("ID de usuário inválido"),
  papel: z.enum(["ADMIN", "MEMBRO"]),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: z.string().optional(), // ISO date string
  endedAt: z.string().nullable().optional(), // ISO date string or null
});

/** Schema de validação para atualização de membro de uma entidade. */
export const updateMemberSchema = z.object({
  papel: z.enum(["ADMIN", "MEMBRO"]).optional(),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: z.string().optional(), // ISO date string
  endedAt: z.string().nullable().optional(), // ISO date string or null
});

/** Schema de validação para criação de cargo em uma entidade. */
export const createCargoSchema = z.object({
  nome: z.string().min(1, "Nome do cargo é obrigatório"),
  descricao: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
});

/** Schema de validação para atualização de cargo em uma entidade. */
export const updateCargoSchema = z.object({
  nome: z.string().min(1, "Nome do cargo é obrigatório").optional(),
  descricao: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
});
