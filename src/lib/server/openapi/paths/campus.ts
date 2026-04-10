import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape de resposta de Campus. Os handlers validam o corpo das requisições
 * inline (sem Zod), então definimos os schemas de request/response aqui.
 */
const campusResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Campus I - João Pessoa" }),
  })
  .openapi("CampusResponse");

const createOrUpdateCampusSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Campus I - João Pessoa" }),
  })
  .openapi("CreateOrUpdateCampusRequest");

export function registerCampusPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/campus",
    tags: ["Campus"],
    summary: "Listar todos os campi",
    description:
      "Retorna todos os campi da UFPB. A UFPB tem múltiplos campi espalhados pelo estado da Paraíba.",
    responses: {
      200: {
        description: "Lista de todos os campi.",
        content: { "application/json": { schema: z.array(campusResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/campus",
    tags: ["Campus"],
    summary: "Criar um novo campus (admin)",
    description:
      "Endpoint exclusivo para administradores. Retorna 409 se já existir um campus com o mesmo nome.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCampusSchema,
            example: { nome: "Campus IV - Rio Tinto" },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Campus criado.",
        content: { "application/json": { schema: campusResponseSchema } },
      },
      ...errorResponses([400, 409], {
        409: { message: "Já existe um campus com esse nome", code: "CONFLICT" },
      }),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/campus/{id}",
    tags: ["Campus"],
    summary: "Atualizar um campus (admin)",
    description: "Endpoint exclusivo para administradores. Renomeia um campus.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCampusSchema,
            example: { nome: "Campus I - João Pessoa" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Campus atualizado.",
        content: { "application/json": { schema: campusResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Campus não encontrado", code: "NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/campus/{id}",
    tags: ["Campus"],
    summary: "Excluir um campus (admin)",
    description:
      "Endpoint exclusivo para administradores. **Retorna 409 com `HAS_DEPENDENCIES` se houver centros acadêmicos vinculados a este campus** — você precisa excluir/reatribuir os centros vinculados antes.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Campus excluído.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      ...errorResponses([404, 409], {
        404: { message: "Campus não encontrado", code: "NOT_FOUND" },
        409: {
          message: "Não é possível excluir: existem 3 centro(s) vinculado(s)",
          code: "HAS_DEPENDENCIES",
        },
      }),
    },
  });
}
