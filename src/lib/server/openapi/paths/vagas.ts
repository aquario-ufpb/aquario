import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { createVagaSchema } from "@/lib/server/api-schemas/vagas";

import type { CommonSchemas } from "../common-schemas";

/**
 * Enum of supported job/opportunity types. Mirrors TIPO_VAGA_VALUES in
 * src/app/api/vagas/route.ts — keep in sync.
 */
const tipoVagaSchema = z
  .enum(["ESTAGIO", "TRAINEE", "VOLUNTARIO", "PESQUISA", "CLT", "PJ", "OUTRO"])
  .openapi({
    description: "Type of job opportunity.",
    example: "ESTAGIO",
  });

/**
 * Publisher summary embedded in vaga responses — the user who created the vaga.
 */
const vagaPublicadorSchema = z.object({
  nome: z.string().openapi({ example: "João Silva" }),
  urlFotoPerfil: z.string().optional(),
});

/**
 * Entity summary embedded in vaga responses.
 */
const vagaEntidadeSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().openapi({ example: "PET Computação" }),
  slug: z.string().optional(),
  tipo: z.string().openapi({ example: "GRUPO" }),
  urlFoto: z.string().optional(),
});

/**
 * Vaga response shape as returned by mapVagaToJson — the canonical JSON
 * representation used by both list and detail endpoints.
 */
const vagaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Estágio em Desenvolvimento Backend" }),
    descricao: z.string().openapi({
      example: "Atuar no desenvolvimento de APIs em Node.js e PostgreSQL...",
    }),
    tipoVaga: tipoVagaSchema,
    areas: z.array(z.string()).openapi({ example: ["Backend", "Node.js", "PostgreSQL"] }),
    criadoEm: z.string().datetime(),
    dataFinalizacao: z.string().datetime().openapi({ example: "2026-05-15T23:59:59.000Z" }),
    linkInscricao: z.string().url().openapi({ example: "https://empresa.com/vagas/123" }),
    salario: z.string().optional().openapi({ example: "R$ 1.500,00" }),
    sobreEmpresa: z.string().optional(),
    responsabilidades: z.array(z.string()),
    requisitos: z.array(z.string()),
    informacoesAdicionais: z.string().optional(),
    etapasProcesso: z.array(z.string()),
    entidade: vagaEntidadeSchema,
    publicador: vagaPublicadorSchema,
  })
  .openapi("VagaResponse");

/**
 * Extended response shape for GET /vagas/{id} which adds an `expirada` flag
 * computed from `dataFinalizacao` vs current time.
 */
const vagaDetailResponseSchema = vagaResponseSchema
  .extend({
    expirada: z.boolean().openapi({
      description: "Whether the vaga has passed its dataFinalizacao.",
      example: false,
    }),
  })
  .openapi("VagaDetailResponse");

export function registerVagasPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/vagas",
    tags: ["Vagas"],
    summary: "List active job opportunities",
    description:
      "Public endpoint returning active (non-expired) vagas. Results can be filtered by job type and by publishing entity category (e.g., only vagas from labs or PET groups).",
    request: {
      query: z.object({
        tipoVaga: tipoVagaSchema.optional().openapi({
          description: "Filter by job type.",
        }),
        entidadeTipos: z.string().optional().openapi({
          description:
            "Comma-separated list of entity types to filter by (e.g., 'LABORATORIO,GRUPO'). Unknown types are ignored.",
          example: "LABORATORIO,GRUPO",
        }),
      }),
    },
    responses: {
      200: {
        description: "List of active vagas.",
        content: { "application/json": { schema: z.array(vagaResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/vagas",
    tags: ["Vagas"],
    summary: "Create a new vaga",
    description:
      "Publish a new job opportunity on behalf of an entity. **Custom permission:** the caller must be either a MASTER_ADMIN or an active ADMIN member of the target entity (`canManageVagaForEntidade` check). The `dataFinalizacao` must be in the future.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createVagaSchema,
            example: {
              titulo: "Estágio em Desenvolvimento Backend",
              descricao: "Atuar no desenvolvimento de APIs em Node.js e PostgreSQL...",
              tipoVaga: "ESTAGIO",
              entidadeId: "550e8400-e29b-41d4-a716-446655440000",
              linkInscricao: "https://empresa.com/vagas/123",
              dataFinalizacao: "2026-05-15",
              areas: ["Backend", "Node.js"],
              salario: "R$ 1.500,00",
              responsabilidades: ["Desenvolver APIs REST", "Escrever testes automatizados"],
              requisitos: ["Conhecimento em Node.js", "Familiaridade com PostgreSQL"],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Vaga created successfully.",
        content: { "application/json": { schema: vagaResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/vagas/{id}",
    tags: ["Vagas"],
    summary: "Get a vaga by id",
    description:
      "Public endpoint to fetch a single vaga with all its details plus an `expirada` flag indicating whether it has passed its deadline.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Vaga details.",
        content: { "application/json": { schema: vagaDetailResponseSchema } },
      },
      ...errorResponses([404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/vagas/{id}",
    tags: ["Vagas"],
    summary: "Soft-delete a vaga",
    description:
      "Soft-delete a vaga (marks it as deleted in the database without removing the record). **Custom permission:** the caller must be either a MASTER_ADMIN or an active ADMIN member of the vaga's entity (`canManageVagaForEntidade` check).",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      204: {
        description: "Vaga deleted successfully. No response body.",
      },
      ...errorResponses([401, 403, 404, 500]),
    },
  });
}
