import { z } from "zod";

/**
 * Zod request schemas for the /api/vagas endpoints.
 *
 * See src/lib/server/api-schemas/auth.ts for the rationale on why these
 * live outside of the route.ts files (Next.js 15 route export restrictions).
 */

/**
 * Allowed job listing types. Re-exported alongside the schema so consumers
 * (handlers, query parsers, tests) can refer to the same canonical tuple.
 */
export const TIPO_VAGA_VALUES = [
  "ESTAGIO",
  "TRAINEE",
  "VOLUNTARIO",
  "PESQUISA",
  "CLT",
  "PJ",
  "OUTRO",
] as const;

/** Schema de validação para criação de vaga. */
export const createVagaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(10000, "Descrição muito longa"),
  tipoVaga: z.enum(TIPO_VAGA_VALUES),
  entidadeId: z.string().uuid("ID de entidade inválido"),
  linkInscricao: z
    .string()
    .url("Link para inscrição deve ser uma URL válida")
    .max(2048, "URL muito longa"),
  dataFinalizacao: z.string().refine(v => !isNaN(Date.parse(v)), {
    message: "Data de finalização inválida",
  }),
  areas: z.array(z.string().min(1).max(100)).max(20).optional().default([]),
  salario: z.string().max(100, "Salário muito longo").nullable().optional(),
  sobreEmpresa: z.string().max(5000, "Texto muito longo").nullable().optional(),
  responsabilidades: z.array(z.string().min(1).max(500)).max(30).optional().default([]),
  requisitos: z.array(z.string().min(1).max(500)).max(30).optional().default([]),
  informacoesAdicionais: z.string().max(5000, "Texto muito longo").nullable().optional(),
  etapasProcesso: z.array(z.string().min(1).max(500)).max(20).optional().default([]),
});
