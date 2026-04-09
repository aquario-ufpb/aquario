import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  createSemestreSchema,
  updateSemestreSchema,
  createEventoSchema,
  updateEventoSchema,
  batchCreateSchema,
} from "@/lib/server/api-schemas/calendario";
import { ALL_CATEGORIAS } from "@/lib/shared/config/calendario-academico";

import type { CommonSchemas } from "../common-schemas";

/**
 * Enum das categorias de evento. Espelha ALL_CATEGORIAS em
 * src/lib/shared/config/calendario-academico.ts — mantido em sincronia via import.
 */
const categoriaEventoSchema = z.enum(ALL_CATEGORIAS).openapi({
  description:
    "Categoria do evento. Usada para agrupamento e cores no calendário. 'OUTRA' é o catch-all para eventos sem categoria definida.",
  example: "INICIO_PERIODO_LETIVO",
});

/**
 * Shape de resposta de SemestreLetivo (semestre acadêmico).
 */
const semestreResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({
      description: "Nome do semestre, tipicamente no formato 'YYYY.N'.",
      example: "2026.1",
    }),
    dataInicio: z.string().datetime().openapi({ example: "2026-03-10T00:00:00.000Z" }),
    dataFim: z.string().datetime().openapi({ example: "2026-07-15T00:00:00.000Z" }),
    ativo: z.boolean().optional().openapi({
      description:
        "Indica se este é o semestre ativo no momento. Exatamente um semestre deve estar ativo por vez.",
      example: true,
    }),
  })
  .openapi("SemestreResponse");

/**
 * Shape de resposta de Evento do calendário.
 */
const eventoResponseSchema = z
  .object({
    id: z.string().uuid(),
    descricao: z.string().openapi({ example: "Início do período letivo 2026.1" }),
    dataInicio: z.string().datetime().openapi({ example: "2026-03-10T00:00:00.000Z" }),
    dataFim: z.string().datetime().openapi({ example: "2026-03-10T00:00:00.000Z" }),
    categoria: categoriaEventoSchema,
    semestreId: z.string().uuid(),
  })
  .openapi("EventoResponse");

const messageResponseSchema = z.object({ message: z.string() });

export function registerCalendarioPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/calendario-academico",
    tags: ["Calendário Acadêmico"],
    summary: "Listar semestres (ou obter o ativo)",
    description:
      "Lista todos os semestres. Use `?ativo=true` para obter apenas o semestre ativo (como objeto único ou `null`).",
    request: {
      query: z.object({
        ativo: z.enum(["true", "false"]).optional().openapi({
          description: "Se `true`, retorna apenas o semestre ativo.",
          example: "true",
        }),
      }),
    },
    responses: {
      200: {
        description: "Array de semestres, ou um único semestre quando `?ativo=true`.",
        content: {
          "application/json": {
            schema: z.union([z.array(semestreResponseSchema), semestreResponseSchema.nullable()]),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico",
    tags: ["Calendário Acadêmico"],
    summary: "Criar um novo semestre (admin)",
    description:
      "Cria um novo semestre. Retorna 409 com `SEMESTRE_NOME_EXISTS` se já existir um semestre com esse nome.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createSemestreSchema,
            example: {
              nome: "2026.1",
              dataInicio: "2026-03-10T00:00:00.000Z",
              dataFim: "2026-07-15T00:00:00.000Z",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Semestre criado.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([400, 409]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/calendario-academico/{id}",
    tags: ["Calendário Acadêmico"],
    summary: "Buscar um semestre pelo ID",
    description:
      "Retorna os detalhes de um semestre específico. Retorna 404 com `SEMESTRE_NOT_FOUND` se o ID não corresponder a nenhum semestre.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Detalhes do semestre.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([404]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/calendario-academico/{id}",
    tags: ["Calendário Acadêmico"],
    summary: "Atualizar um semestre (admin)",
    description:
      "Endpoint exclusivo para administradores. Atualiza nome ou datas de um semestre. Todos os campos são opcionais — apenas os enviados são atualizados.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateSemestreSchema,
            example: { dataFim: "2026-07-22T00:00:00.000Z" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Semestre atualizado.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([400, 404, 409]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/calendario-academico/{id}",
    tags: ["Calendário Acadêmico"],
    summary: "Excluir um semestre (admin)",
    description:
      "Endpoint exclusivo para administradores. Os eventos vinculados também são removidos como parte da exclusão.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Semestre excluído.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Semestre removido com sucesso" },
          },
        },
      },
      ...errorResponses([404]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/calendario-academico/{id}/eventos",
    tags: ["Calendário Acadêmico"],
    summary: "Listar eventos de um semestre",
    description:
      "Retorna todos os eventos (feriados, prazos de matrícula, períodos de prova, etc) agendados para o semestre especificado.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de eventos do semestre.",
        content: { "application/json": { schema: z.array(eventoResponseSchema) } },
      },
      ...errorResponses([404]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico/{id}/eventos",
    tags: ["Calendário Acadêmico"],
    summary: "Criar um novo evento em um semestre (admin)",
    description:
      "Endpoint exclusivo para administradores. Adiciona um novo evento ao semestre especificado. Eventos são categorizados pelo campo `categoria` (feriados, períodos de prova, etc) para agrupamento na UI.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createEventoSchema,
            example: {
              descricao: "Início do período letivo 2026.1",
              dataInicio: "2026-03-10T00:00:00.000Z",
              dataFim: "2026-03-10T00:00:00.000Z",
              categoria: "INICIO_PERIODO_LETIVO",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Evento criado.",
        content: { "application/json": { schema: eventoResponseSchema } },
      },
      ...errorResponses([400, 404]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/calendario-academico/{id}/eventos/{eventoId}",
    tags: ["Calendário Acadêmico"],
    summary: "Atualizar um evento (admin)",
    description:
      "Endpoint exclusivo para administradores. Atualiza a descrição, datas ou categoria de um evento. Todos os campos são opcionais. Retorna 404 com `EVENTO_NOT_FOUND` se o evento não existir.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        eventoId: z.string().uuid(),
      }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateEventoSchema,
            example: {
              descricao: "Início do período letivo 2026.1 (reagendado)",
              dataInicio: "2026-03-17T00:00:00.000Z",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Evento atualizado.",
        content: { "application/json": { schema: eventoResponseSchema } },
      },
      ...errorResponses([400, 404]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/calendario-academico/{id}/eventos/{eventoId}",
    tags: ["Calendário Acadêmico"],
    summary: "Excluir um evento (admin)",
    description: "Endpoint exclusivo para administradores. Exclui um evento do semestre.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        eventoId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Evento excluído.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Evento removido com sucesso" },
          },
        },
      },
      ...errorResponses([404]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico/{id}/eventos/batch",
    tags: ["Calendário Acadêmico"],
    summary: "Criar (ou substituir) eventos em lote em um semestre (admin)",
    description:
      "Endpoint exclusivo para administradores. Cria múltiplos eventos em uma única requisição — usado pelo fluxo de import via CSV. Quando `replace: true`, TODOS os eventos existentes do semestre são excluídos antes de inserir o novo lote (use com cuidado). Com `replace: false` (padrão), novos eventos são apenas adicionados.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: batchCreateSchema,
            example: {
              replace: false,
              eventos: [
                {
                  descricao: "Feriado municipal de São João",
                  dataInicio: "2026-06-24T00:00:00.000Z",
                  dataFim: "2026-06-24T00:00:00.000Z",
                  categoria: "FERIADO",
                },
                {
                  descricao: "Início das provas finais",
                  dataInicio: "2026-07-01T00:00:00.000Z",
                  dataFim: "2026-07-05T00:00:00.000Z",
                  categoria: "EXAMES_FINAIS",
                },
              ],
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Eventos criados. A resposta inclui o total de eventos inseridos.",
        content: {
          "application/json": {
            schema: z.object({ count: z.number().int().openapi({ example: 2 }) }),
          },
        },
      },
      ...errorResponses([400, 404]),
    },
  });
}
