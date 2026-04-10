import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape de Guia. Guias organizam conteúdo tutorial para estudantes —
 * tipicamente associados a um curso (ex: "Guia do Calouro de Ciência da
 * Computação"). Os handlers retornam objetos no formato do Prisma sem mapper
 * explícito, então o schema espelha o shape vindo do repositório.
 */
const guiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Guia do Calouro de Ciência da Computação" }),
    descricao: z.string().nullable().optional(),
    cursoId: z.string().uuid().nullable().optional(),
    status: z
      .enum(["PUBLICADO", "RASCUNHO", "ARQUIVADO"])
      .optional()
      .openapi({ example: "PUBLICADO" }),
    criadoEm: z.string().datetime().optional(),
    atualizadoEm: z.string().datetime().optional(),
  })
  .openapi("GuiaResponse");

/** Shape de resposta de seção de guia. */
const secaoGuiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Primeiros passos no campus" }),
    descricao: z.string().nullable().optional(),
    ordem: z.number().int().openapi({ example: 1 }),
    guiaId: z.string().uuid(),
  })
  .openapi("SecaoGuiaResponse");

/** Shape de resposta de subseção de guia. */
const subSecaoGuiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Onde fica o Centro de Informática" }),
    conteudo: z.string().openapi({
      description: "Conteúdo da subseção em Markdown.",
      example: "O CI fica localizado no Campus I, próximo ao bloco de engenharias...",
    }),
    ordem: z.number().int().openapi({ example: 1 }),
    secaoId: z.string().uuid(),
  })
  .openapi("SubSecaoGuiaResponse");

/** Registra os paths de guias no registry OpenAPI. */
export function registerGuiasPaths(registry: OpenAPIRegistry, _schemas: CommonSchemas): void {
  registry.registerPath({
    method: "get",
    path: "/guias",
    tags: ["Guias"],
    summary: "Listar guias (opcionalmente filtrados por curso)",
    description:
      "Retorna todos os guias acadêmicos. Use `cursoId` para filtrar apenas os guias associados a um curso específico.",
    request: {
      query: z.object({
        cursoId: z.string().uuid().optional().openapi({
          description: "Filtra guias pelo ID do curso.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Lista de guias.",
        content: { "application/json": { schema: z.array(guiaResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/guias/{id}/secoes",
    tags: ["Guias"],
    summary: "Listar seções de um guia",
    description:
      "Retorna todas as seções de nível superior de um guia, ordenadas pelo campo `ordem`. Seções agrupam subseções relacionadas dentro de um guia.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de seções ordenadas pelo campo `ordem`.",
        content: { "application/json": { schema: z.array(secaoGuiaResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/guias/secoes/{id}/subsecoes",
    tags: ["Guias"],
    summary: "Listar subseções de uma seção",
    description:
      "Retorna todas as subseções de uma seção, ordenadas pelo campo `ordem`. O conteúdo das subseções é Markdown.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de subseções ordenadas pelo campo `ordem`.",
        content: { "application/json": { schema: z.array(subSecaoGuiaResponseSchema) } },
      },
    },
  });
}
