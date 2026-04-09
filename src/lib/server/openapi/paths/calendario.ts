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
 * Enum of event categories. Mirrors ALL_CATEGORIAS in
 * src/lib/shared/config/calendario-academico.ts — kept in sync via the import.
 */
const categoriaEventoSchema = z.enum(ALL_CATEGORIAS).openapi({
  description:
    "Category of the event. Used for display grouping and color coding in the calendar UI. 'OUTRA' is a catch-all for uncategorized events.",
  example: "INICIO_PERIODO_LETIVO",
});

/**
 * SemestreLetivo (academic semester) response shape.
 */
const semestreResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({
      description: "Semester name, typically in the 'YYYY.N' format.",
      example: "2026.1",
    }),
    dataInicio: z.string().datetime().openapi({ example: "2026-03-10T00:00:00.000Z" }),
    dataFim: z.string().datetime().openapi({ example: "2026-07-15T00:00:00.000Z" }),
    ativo: z.boolean().optional().openapi({
      description:
        "Whether this is the currently active semester. Exactly one semester should be active at a time.",
      example: true,
    }),
  })
  .openapi("SemestreResponse");

/**
 * Evento (calendar event) response shape.
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
    tags: ["Academic Calendar"],
    summary: "List semesters (or get the active one)",
    description:
      "Public endpoint for reading semesters from the academic calendar.\n\n**Response shape depends on the `ativo` query parameter:**\n- Without `?ativo=true`: returns an array of all semesters.\n- With `?ativo=true`: returns the currently active semester as a single object, or `null` if no semester is currently active.\n\nConsumers must inspect the response type and handle both cases.",
    request: {
      query: z.object({
        ativo: z.enum(["true", "false"]).optional().openapi({
          description:
            "Set to 'true' to receive only the active semester as a single object (or null) instead of the full list.",
          example: "true",
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Either an array of semesters (default) or a single semester object/null (when `?ativo=true`).",
        content: {
          "application/json": {
            schema: z.union([z.array(semestreResponseSchema), semestreResponseSchema.nullable()]),
          },
        },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico",
    tags: ["Academic Calendar"],
    summary: "Create a new semester (admin only)",
    description:
      "Admin-only endpoint to create a new academic semester. Returns 409 with `SEMESTRE_NOME_EXISTS` if a semester with the same name already exists.",
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
        description: "Semester created.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 409, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/calendario-academico/{id}",
    tags: ["Academic Calendar"],
    summary: "Get a semester by id",
    description:
      "Public endpoint returning the details of a specific semester. Returns 404 with `SEMESTRE_NOT_FOUND` if the id does not match any semester.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Semester details.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([404, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/calendario-academico/{id}",
    tags: ["Academic Calendar"],
    summary: "Update a semester (admin only)",
    description:
      "Admin-only endpoint to update a semester's name or dates. All fields are optional — only provided fields are updated.",
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
        description: "Semester updated.",
        content: { "application/json": { schema: semestreResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/calendario-academico/{id}",
    tags: ["Academic Calendar"],
    summary: "Delete a semester (admin only)",
    description:
      "Admin-only endpoint to delete a semester. Related events are also removed as part of the deletion.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Semester deleted.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Semestre removido com sucesso" },
          },
        },
      },
      ...errorResponses([401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/calendario-academico/{id}/eventos",
    tags: ["Academic Calendar"],
    summary: "List events for a semester",
    description:
      "Public endpoint returning all events (holidays, registration deadlines, exam periods, etc) scheduled for the specified semester.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of events for the semester.",
        content: { "application/json": { schema: z.array(eventoResponseSchema) } },
      },
      ...errorResponses([404, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico/{id}/eventos",
    tags: ["Academic Calendar"],
    summary: "Create a new event in a semester (admin only)",
    description:
      "Admin-only endpoint to add a new event to the specified semester. Events are categorized via the `categoria` field (holidays, exam periods, etc) for UI display grouping.",
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
        description: "Event created.",
        content: { "application/json": { schema: eventoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/calendario-academico/{id}/eventos/{eventoId}",
    tags: ["Academic Calendar"],
    summary: "Update an event (admin only)",
    description:
      "Admin-only endpoint to update an event's description, dates, or category. All fields are optional. Returns 404 with `EVENTO_NOT_FOUND` if the event does not exist.",
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
        description: "Event updated.",
        content: { "application/json": { schema: eventoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/calendario-academico/{id}/eventos/{eventoId}",
    tags: ["Academic Calendar"],
    summary: "Delete an event (admin only)",
    description: "Admin-only endpoint to delete an event from the semester.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        eventoId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Event deleted.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Evento removido com sucesso" },
          },
        },
      },
      ...errorResponses([401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/calendario-academico/{id}/eventos/batch",
    tags: ["Academic Calendar"],
    summary: "Batch create (or replace) events in a semester (admin only)",
    description:
      "Admin-only endpoint to create multiple events in a single request — used by the CSV import flow. When `replace: true`, ALL existing events for the semester are deleted before inserting the new batch (use with caution). When `replace: false` (default), new events are appended.",
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
        description: "Events created. Response includes the total number of events inserted.",
        content: {
          "application/json": {
            schema: z.object({ count: z.number().int().openapi({ example: 2 }) }),
          },
        },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });
}
