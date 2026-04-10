import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape de resposta de Centro Acadêmico (ex: Centro de Informática). Os
 * handlers validam o corpo das requisições inline, sem schemas Zod, então
 * os shapes de request/response são definidos aqui.
 */
const centroResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Centro de Informática" }),
    sigla: z.string().openapi({ example: "CI" }),
    descricao: z.string().nullable().optional(),
    campusId: z.string().uuid(),
  })
  .openapi("CentroResponse");

const createOrUpdateCentroSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Centro de Informática" }),
    sigla: z.string().min(1).openapi({ example: "CI" }),
    descricao: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Centro responsável pelos cursos de computação na UFPB." }),
    campusId: z.string().uuid().openapi({ example: "b2c3d4e5-f6a7-8901-bcde-f23456789012" }),
  })
  .openapi("CreateOrUpdateCentroRequest");

/**
 * Shape simplificado de curso retornado por GET /centros/{id}/cursos.
 */
const centroCursoSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string(),
    centroId: z.string().uuid(),
  })
  .openapi("CentroCurso");

export function registerCentrosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/centros",
    tags: ["Centros Acadêmicos"],
    summary: "Listar todos os centros acadêmicos",
    description:
      "Retorna todos os centros acadêmicos (ex: Centro de Informática, Centro de Ciências Exatas) de todos os campi.",
    responses: {
      200: {
        description: "Lista de todos os centros.",
        content: { "application/json": { schema: z.array(centroResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/centros",
    tags: ["Centros Acadêmicos"],
    summary: "Criar um novo centro acadêmico (admin)",
    description: "Endpoint exclusivo para administradores. Cria um novo centro acadêmico.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCentroSchema,
            example: {
              nome: "Centro de Informática",
              sigla: "CI",
              descricao:
                "Responsável pelos cursos de Ciência da Computação e Sistemas de Informação.",
              campusId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Centro criado.",
        content: { "application/json": { schema: centroResponseSchema } },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/centros/{id}",
    tags: ["Centros Acadêmicos"],
    summary: "Atualizar um centro acadêmico (admin)",
    description: "Endpoint exclusivo para administradores. Atualiza um centro acadêmico.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCentroSchema,
            example: {
              nome: "Centro de Informática",
              sigla: "CI",
              descricao: "Centro atualizado.",
              campusId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Centro atualizado.",
        content: { "application/json": { schema: centroResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Centro não encontrado", code: "NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/centros/{id}",
    tags: ["Centros Acadêmicos"],
    summary: "Excluir um centro acadêmico (admin)",
    description:
      "Endpoint exclusivo para administradores. **Retorna 409 com `HAS_DEPENDENCIES` se houver cursos vinculados a este centro** — é necessário excluir/reatribuir os cursos vinculados antes.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Centro excluído.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      ...errorResponses([404, 409], {
        404: { message: "Centro não encontrado", code: "NOT_FOUND" },
        409: {
          message: "Não é possível excluir: existem 2 curso(s) vinculado(s)",
          code: "HAS_DEPENDENCIES",
        },
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/centros/{id}/cursos",
    tags: ["Centros Acadêmicos"],
    summary: "Listar cursos de um centro",
    description: "Retorna todos os cursos oferecidos pelo centro especificado.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de cursos deste centro.",
        content: { "application/json": { schema: z.array(centroCursoSchema) } },
      },
    },
  });
}
