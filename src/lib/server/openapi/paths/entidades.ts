import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { updateEntidadeSchema } from "@/app/api/entidades/[id]/route";
import { addMemberSchema } from "@/app/api/entidades/[id]/membros/route";
import { updateMemberSchema } from "@/app/api/entidades/[id]/membros/[membroId]/route";
import { createCargoSchema, updateCargoSchema } from "@/app/api/entidades/[id]/cargos/route";

import { errorResponses } from "../common-schemas";

/**
 * Enum of entity types (LABORATORIO, GRUPO, etc). Mirrors the values accepted
 * by updateEntidadeSchema's `tipo` field.
 */
const tipoEntidadeSchema = z
  .enum([
    "LABORATORIO",
    "GRUPO",
    "LIGA_ACADEMICA",
    "EMPRESA",
    "ATLETICA",
    "CENTRO_ACADEMICO",
    "OUTRO",
  ])
  .openapi({
    description:
      "Entity category. PET groups are modeled under 'GRUPO'. Student unions (DCEs, centros acadêmicos) use 'CENTRO_ACADEMICO'.",
    example: "GRUPO",
  });

/**
 * Public entidade shape returned by GET /entidades, GET /entidades/slug/{slug}, etc.
 * Includes the embedded centro and — when loaded — the list of active memberships.
 */
const entidadeResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "PET Computação" }),
    slug: z.string().nullable().openapi({ example: "pet-computacao" }),
    subtitle: z.string().nullable().optional().openapi({
      example: "Programa de Educação Tutorial da Ciência da Computação",
    }),
    descricao: z.string().nullable().optional(),
    tipo: tipoEntidadeSchema,
    urlFoto: z.string().nullable().optional(),
    contato: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    foundingDate: z.string().datetime().nullable().optional(),
    centro: z
      .object({
        id: z.string().uuid(),
        nome: z.string().openapi({ example: "Centro de Informática" }),
        sigla: z.string().openapi({ example: "CI" }),
      })
      .optional(),
    membros: z
      .array(
        z.object({
          id: z.string().uuid(),
          papel: z.enum(["ADMIN", "MEMBRO"]),
          usuario: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            slug: z.string().nullable(),
            urlFotoPerfil: z.string().nullable(),
          }),
          cargo: z
            .object({
              id: z.string().uuid(),
              nome: z.string(),
            })
            .nullable()
            .optional(),
        })
      )
      .optional(),
  })
  .openapi("EntidadeResponse");

/**
 * Response shape for entity-scoped membership endpoints (POST/PUT under
 * /entidades/{id}/membros). Differs from the user-scoped membership shape
 * in `paths/usuarios.ts` because it nests the user instead of the entity.
 */
const entidadeMembershipResponseSchema = z
  .object({
    id: z.string().uuid(),
    usuario: z.object({
      id: z.string().uuid(),
      nome: z.string(),
      slug: z.string().nullable(),
      urlFotoPerfil: z.string().nullable(),
      eFacade: z.boolean(),
      curso: z.object({
        id: z.string().uuid(),
        nome: z.string(),
      }),
    }),
    papel: z.enum(["ADMIN", "MEMBRO"]),
    cargo: z
      .object({
        id: z.string().uuid(),
        nome: z.string(),
      })
      .nullable()
      .optional(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().nullable(),
  })
  .openapi("EntidadeMembershipResponse");

/**
 * Cargo (role title) shape returned by cargos endpoints.
 */
const cargoResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Tutor" }),
    descricao: z.string().nullable().optional(),
    ordem: z.number().int().openapi({ example: 0 }),
    entidadeId: z.string().uuid(),
  })
  .openapi("CargoResponse");

const messageResponseSchema = z.object({ message: z.string() });

/**
 * PUT cargo request body schema. Unlike POST which uses `createCargoSchema`,
 * the PUT handler expects `cargoId` in the body alongside the update fields.
 */
const updateCargoRequestSchema = updateCargoSchema
  .extend({
    cargoId: z.string().uuid().openapi({
      description: "ID of the cargo to update. Sent in the body (not the URL) on PUT requests.",
    }),
  })
  .openapi("UpdateCargoRequest");

export function registerEntidadesPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/entidades",
    tags: ["Entities"],
    summary: "List all entities",
    description:
      "Public endpoint returning all entities (labs, PET groups, student unions, companies, athletics associations) registered in the system. Results include the embedded centro but not the full member list — fetch that via GET /entidades/slug/{slug} or /entidades/{id}/membros.",
    responses: {
      200: {
        description: "List of all entities.",
        content: { "application/json": { schema: z.array(entidadeResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/entidades/slug/{slug}",
    tags: ["Entities"],
    summary: "Look up an entity by slug",
    description:
      "Public endpoint to fetch an entity's full profile (with members and cargos) by its URL slug. Used by the `/entidade/[slug]` pages.",
    request: {
      params: z.object({
        slug: z.string().openapi({ example: "pet-computacao" }),
      }),
    },
    responses: {
      200: {
        description: "Entity profile with embedded members and cargos.",
        content: { "application/json": { schema: entidadeResponseSchema } },
      },
      ...errorResponses([404, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}",
    tags: ["Entities"],
    summary: "Update an entity",
    description:
      "Update entity fields (name, description, social links, etc). **Requires either MASTER_ADMIN role or an active ADMIN membership in the target entity.** All fields are optional — only provided fields are updated.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateEntidadeSchema,
            example: {
              descricao: "Programa de Educação Tutorial focado em Ciência da Computação.",
              website: "https://petcomputacao.ufpb.br",
              instagram: "@petcomputacao",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Entity updated.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Entidade atualizada com sucesso." },
          },
        },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/entidades/{id}/membros",
    tags: ["Entities"],
    summary: "Add a member to an entity",
    description:
      "Add a user as a member of the entity. **Requires either MASTER_ADMIN role or an active ADMIN membership in the target entity.** Returns 409 if the user is already an active member. To let users join entities themselves, use POST /usuarios/me/membros instead.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: addMemberSchema,
            example: {
              usuarioId: "550e8400-e29b-41d4-a716-446655440000",
              papel: "MEMBRO",
              cargoId: "661f9511-f30b-52e5-b827-557766551111",
              startedAt: "2026-01-15T00:00:00.000Z",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Member added.",
        content: { "application/json": { schema: entidadeMembershipResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}/membros/{membroId}",
    tags: ["Entities"],
    summary: "Update a member of an entity",
    description:
      "Update a member's role, cargo, or dates inside the entity. **Requires MASTER_ADMIN or active ADMIN membership in the entity.** To update your own membership (non-admin use case), use PUT /usuarios/me/membros/{membroId} instead.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        membroId: z.string().uuid(),
      }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateMemberSchema,
            example: { endedAt: "2026-12-31T23:59:59.000Z" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Member updated.",
        content: { "application/json": { schema: entidadeMembershipResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/entidades/{id}/membros/{membroId}",
    tags: ["Entities"],
    summary: "Remove a member from an entity",
    description:
      "Permanently delete a membership from the entity. **Requires MASTER_ADMIN or active ADMIN membership in the entity.**",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        membroId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Member removed.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Membresia deletada com sucesso." },
          },
        },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/entidades/{id}/cargos",
    tags: ["Entities"],
    summary: "List all cargos for an entity",
    description:
      "Public endpoint returning the list of cargos (role titles) defined for this entity. Cargos are used as the `cargoId` field when creating or updating memberships.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of cargos.",
        content: { "application/json": { schema: z.array(cargoResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/entidades/{id}/cargos",
    tags: ["Entities"],
    summary: "Create a new cargo for an entity",
    description:
      "Define a new cargo (role title) in the entity. **Requires MASTER_ADMIN or active ADMIN membership in the entity.**",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createCargoSchema,
            example: {
              nome: "Tutor",
              descricao: "Responsável por orientar os bolsistas",
              ordem: 0,
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Cargo created.",
        content: { "application/json": { schema: cargoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}/cargos",
    tags: ["Entities"],
    summary: "Update a cargo for an entity",
    description:
      "Update an existing cargo. **Unusual pattern:** the cargo id is sent in the **request body** (as `cargoId`), not in the URL. All other update fields are optional. **Requires MASTER_ADMIN or active ADMIN membership in the entity.**",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateCargoRequestSchema,
            example: { cargoId: "550e8400-e29b-41d4-a716-446655440000", nome: "Tutor Sênior" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Cargo updated.",
        content: { "application/json": { schema: cargoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/entidades/{id}/cargos",
    tags: ["Entities"],
    summary: "Delete a cargo from an entity",
    description:
      "Delete a cargo. **Unusual pattern:** the cargo id is sent as a `?cargoId=` query parameter, not in the URL path. **Requires MASTER_ADMIN or active ADMIN membership in the entity.**",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        cargoId: z.string().uuid().openapi({
          description: "ID of the cargo to delete.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Cargo deleted.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Cargo deletado com sucesso." },
          },
        },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });
}
