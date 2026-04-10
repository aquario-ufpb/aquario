import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape de resposta de Curso. Os handlers não usam Zod para validar requests
 * (validam os campos inline), então definimos os schemas de request e response
 * diretamente aqui.
 */
const cursoResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Ciência da Computação" }),
    centroId: z.string().uuid(),
  })
  .openapi("CursoResponse");

const createOrUpdateCursoSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Ciência da Computação" }),
    centroId: z.string().uuid().openapi({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
  })
  .openapi("CreateOrUpdateCursoRequest");

export function registerCursosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/cursos",
    tags: ["Cursos"],
    summary: "Listar todos os cursos",
    description:
      "Retorna todos os cursos de todos os centros. Usado pelo formulário de cadastro, pelo navegador de currículo e pela busca.",
    responses: {
      200: {
        description: "Lista de todos os cursos.",
        content: { "application/json": { schema: z.array(cursoResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/cursos",
    tags: ["Cursos"],
    summary: "Criar um novo curso (admin)",
    description:
      "Endpoint exclusivo para administradores. Tanto `nome` quanto `centroId` são obrigatórios.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCursoSchema,
            example: {
              nome: "Sistemas de Informação",
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Curso criado.",
        content: { "application/json": { schema: cursoResponseSchema } },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/cursos/{id}",
    tags: ["Cursos"],
    summary: "Atualizar um curso (admin)",
    description:
      "Endpoint exclusivo para administradores. Atualiza o nome e/ou o centro de um curso.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCursoSchema,
            example: {
              nome: "Ciência da Computação",
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Curso atualizado.",
        content: { "application/json": { schema: cursoResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Curso não encontrado", code: "NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/cursos/{id}",
    tags: ["Cursos"],
    summary: "Excluir um curso (admin)",
    description:
      "Endpoint exclusivo para administradores. **Retorna 409 com `HAS_DEPENDENCIES` se houver currículos, guias ou usuários vinculados a este curso** — é necessário remover/reatribuir as dependências antes de excluir. A mensagem de erro lista as contagens.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Curso excluído.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      ...errorResponses([404, 409], {
        404: { message: "Curso não encontrado", code: "NOT_FOUND" },
        409: {
          message: "Não é possível excluir: existem 2 currículo(s), 1 guia(s) vinculado(s)",
          code: "HAS_DEPENDENCIES",
        },
      }),
    },
  });
}
