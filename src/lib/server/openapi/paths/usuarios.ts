import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { updateUserInfoSchema } from "@/app/api/usuarios/[id]/info/route";
import { updateRoleSchema } from "@/app/api/usuarios/[id]/role/route";
import { updateSlugSchema } from "@/app/api/usuarios/[id]/slug/route";
import { createFacadeUserSchema } from "@/app/api/usuarios/facade/route";
import { mergeFacadeUserSchema } from "@/app/api/usuarios/merge-facade/route";
import { updateCompletedDisciplinasSchema } from "@/app/api/usuarios/me/disciplinas/route";
import { marcarDisciplinasSchema } from "@/app/api/usuarios/me/disciplinas/marcar/route";
import { createOwnMembershipSchema } from "@/app/api/usuarios/me/membros/route";
import { updateOwnMembershipSchema } from "@/app/api/usuarios/me/membros/[membroId]/route";
import { patchSchema as onboardingPatchSchema } from "@/app/api/usuarios/me/onboarding/route";
import { patchSchema as updatePeriodoSchema } from "@/app/api/usuarios/me/periodo/route";
import { updatePhotoSchema } from "@/app/api/usuarios/me/photo/route";
import { saveSchema as saveSemestreDisciplinasSchema } from "@/app/api/usuarios/me/semestres/[semestreId]/disciplinas/route";
import { patchSchema as updateDisciplinaSemestreSchema } from "@/app/api/usuarios/me/semestres/[semestreId]/disciplinas/[disciplinaSemestreId]/route";

import type { CommonSchemas } from "../common-schemas";

/**
 * User profile shape returned by the `formatUserResponse` mapper. Mirrors the
 * output of src/lib/server/utils/format-user-response.ts — do NOT substitute
 * with the raw Prisma `Usuario` type (it includes sensitive fields).
 *
 * Also used by other endpoints that return a user (PATCH /photo, PATCH /slug,
 * PATCH /info, POST /facade, etc).
 */
const userProfileSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    nome: z.string().openapi({ example: "João Silva" }),
    email: z.string().nullable().openapi({
      description: "Email address. Null for facade users (placeholders created by admins).",
      example: "joao.silva@academico.ufpb.br",
    }),
    slug: z.string().nullable().openapi({ example: "joao-silva" }),
    papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]).openapi({ example: "USER" }),
    eVerificado: z.boolean().openapi({ example: true }),
    urlFotoPerfil: z
      .string()
      .nullable()
      .openapi({ example: "https://blob.vercel-storage.com/photos/550e8400-1712668800.webp" }),
    periodoAtual: z.string().nullable().optional().openapi({
      description: "Current semester (1–12, '12+', or 'graduado'). Null until set by the user.",
      example: "5",
    }),
    centro: z.object({
      id: z.string().uuid(),
      nome: z.string().openapi({ example: "Centro de Informática" }),
      sigla: z.string().openapi({ example: "CI" }),
    }),
    curso: z.object({
      id: z.string().uuid(),
      nome: z.string().openapi({ example: "Ciência da Computação" }),
    }),
    permissoes: z.array(z.string()).openapi({
      example: ["entidade:admin:a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    }),
  })
  .openapi("UserProfile");

/**
 * Extended user shape that includes the `eFacade` flag. Returned by admin-only
 * endpoints (GET /usuarios, POST /facade) so admins can distinguish real users
 * from facade placeholders.
 */
const adminUserResponseSchema = userProfileSchema
  .extend({
    eFacade: z.boolean().openapi({
      description: "Whether this is a facade user (placeholder created by an admin, no login).",
      example: false,
    }),
  })
  .openapi("AdminUserResponse");

/**
 * Simplified entity summary embedded in membership responses.
 */
const membershipEntidadeSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "PET Computação" }),
    slug: z.string().nullable().openapi({ example: "pet-computacao" }),
    tipo: z.string().openapi({ example: "PET" }),
    urlFoto: z.string().nullable(),
    centro: z
      .object({
        id: z.string().uuid(),
        nome: z.string(),
        sigla: z.string(),
      })
      .optional(),
  })
  .openapi("MembershipEntidade");

/**
 * Cargo (role title) inside an entity membership.
 */
const cargoSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Tutor" }),
    descricao: z.string().nullable().optional(),
  })
  .openapi("Cargo");

/**
 * Membership response shape returned by endpoints that list or return
 * memberships (/usuarios/{id}/membros, /usuarios/me/membros, etc).
 */
const membershipResponseSchema = z
  .object({
    id: z.string().uuid(),
    entidade: membershipEntidadeSchema,
    papel: z.enum(["ADMIN", "MEMBRO"]).openapi({ example: "MEMBRO" }),
    cargo: cargoSchema.nullable().optional(),
    startedAt: z.string().datetime().openapi({ example: "2026-01-15T00:00:00.000Z" }),
    endedAt: z.string().datetime().nullable().openapi({ example: null }),
  })
  .openapi("MembershipResponse");

/**
 * DisciplinaSemestre response shape returned by semester discipline endpoints.
 */
const disciplinaSemestreResponseSchema = z
  .object({
    id: z.string().uuid(),
    disciplinaId: z.string().uuid(),
    disciplinaCodigo: z.string().openapi({ example: "DCE1001" }),
    disciplinaNome: z.string().openapi({ example: "Introdução à Computação" }),
    turma: z.string().nullable().openapi({ example: "01" }),
    docente: z.string().nullable().openapi({ example: "Prof. Maria Santos" }),
    horario: z.string().nullable().openapi({ example: "24T34" }),
    codigoPaas: z.number().int().nullable().openapi({ example: 12345 }),
    criadoEm: z.string().datetime(),
  })
  .openapi("DisciplinaSemestreResponse");

/**
 * Envelope for GET/PUT /usuarios/me/semestres/{semestreId}/disciplinas.
 */
const semestreDisciplinasResponseSchema = z
  .object({
    semestreLetivoId: z.string().uuid().nullable(),
    disciplinas: z.array(disciplinaSemestreResponseSchema),
    skippedCodigos: z.array(z.string()).optional().openapi({
      description:
        "Discipline codes that could not be resolved to a valid record and were skipped (only present on PUT responses when applicable).",
    }),
  })
  .openapi("SemestreDisciplinasResponse");

/**
 * Simple message response used by DELETE endpoints and other success confirmations.
 */
const messageResponseSchema = z
  .object({ message: z.string() })
  .openapi({ description: "Simple status message response." });

export function registerUsuariosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses, PaginationMetaSchema } = schemas;

  /**
   * Paginated user list envelope for GET /usuarios (with ?page and ?limit).
   * Defined inside the register function so it can reference the shared
   * PaginationMetaSchema from the current registry — building it at module
   * level would capture a stale reference across multiple document generations.
   */
  const paginatedUsersResponseSchema = z
    .object({
      users: z.array(adminUserResponseSchema),
      pagination: PaginationMetaSchema,
    })
    .openapi("PaginatedUsersResponse");
  // ============================================================================
  // GET /usuarios — three-mode listing (see edge case documentation)
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios",
    tags: ["Users"],
    summary: "List users (three modes: search, paginated, or all)",
    description:
      "This endpoint has **three distinct modes** depending on the query parameters supplied, each with different authentication requirements:\n\n- **Search mode** (`?search=term` without `?page`): returns an envelope with users matching the query. Requires any authenticated user (`bearerAuth`).\n- **Paginated mode** (`?page=N` and/or `?limit=N`): returns a paginated envelope `{ users, pagination }`. Requires MASTER_ADMIN role.\n- **Full dump mode** (no query params): returns an array of ALL users (legacy backward-compatibility mode). Requires MASTER_ADMIN role.\n\nThe response shape differs across modes — consumers should check for the presence of the `pagination` key to distinguish the envelope form from the raw array form.",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        search: z.string().optional().openapi({
          description: "Search term (used in search and paginated modes).",
          example: "joão",
        }),
        page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
        limit: z.coerce.number().int().positive().max(100).optional().openapi({ example: 25 }),
        filter: z.enum(["all", "facade", "real"]).optional().openapi({
          description:
            "Filter by user type: 'all' (default), 'facade' (placeholder users), or 'real' (normal users with email).",
          example: "all",
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Users matching the query. Response shape depends on the mode: paginated envelope `{ users, pagination }` for search/pagination modes, bare array for full dump mode.",
        content: {
          "application/json": {
            schema: z.union([paginatedUsersResponseSchema, z.array(adminUserResponseSchema)]),
          },
        },
      },
      ...errorResponses([401, 403, 500]),
    },
  });

  // ============================================================================
  // DELETE /usuarios/{id} — admin-only, prevents self-delete
  // ============================================================================
  registry.registerPath({
    method: "delete",
    path: "/usuarios/{id}",
    tags: ["Users"],
    summary: "Delete a user (admin only)",
    description:
      "Permanently delete a user account. Admins cannot delete their own account through this endpoint — a 400 is returned in that case to prevent accidental lockout.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
      }),
    },
    responses: {
      200: {
        description: "User deleted successfully.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Usuário deletado com sucesso." },
          },
        },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/info — admin-only (update centro/curso)
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/info",
    tags: ["Users"],
    summary: "Update a user's academic center and/or course (admin only)",
    description:
      "Admin-only endpoint to correct a user's centro and/or curso. Both fields are optional — omit a field to leave it unchanged. Used when users are incorrectly assigned during registration.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateUserInfoSchema,
            example: {
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
              cursoId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "User info updated.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  // ============================================================================
  // GET /usuarios/{id}/membros — list memberships for a user (public)
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/{id}/membros",
    tags: ["Users"],
    summary: "List memberships for a specific user",
    description:
      "Return all entity memberships (active and historical) for the specified user. Public endpoint — useful for displaying a user's affiliations on their profile page.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of memberships for the user.",
        content: {
          "application/json": {
            schema: z.array(membershipResponseSchema),
            example: [
              {
                id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                entidade: {
                  id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                  nome: "PET Computação",
                  slug: "pet-computacao",
                  tipo: "PET",
                  urlFoto: null,
                  centro: {
                    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
                    nome: "Centro de Informática",
                    sigla: "CI",
                  },
                },
                papel: "MEMBRO",
                cargo: { id: "d4e5f6a7-b8c9-0123-defa-456789012345", nome: "Tutor" },
                startedAt: "2026-01-15T00:00:00.000Z",
                endedAt: null,
              },
            ],
          },
        },
      },
      ...errorResponses([500]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/role — admin-only, prevents self-demotion
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/role",
    tags: ["Users"],
    summary: "Update a user's platform role (admin only)",
    description:
      "Admin-only endpoint to promote or demote users between USER and MASTER_ADMIN. Admins cannot change their own role through this endpoint to prevent accidental lockout.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateRoleSchema,
            example: { papelPlataforma: "MASTER_ADMIN" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Role updated successfully.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/slug — admin-only
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/slug",
    tags: ["Users"],
    summary: "Update a user's slug (admin only)",
    description:
      "Admin-only endpoint to change a user's URL slug. The slug is normalized (trimmed, lowercased) server-side. Pass null to remove the slug. Slugs must be unique across all users — 409 is returned on collision.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateSlugSchema,
            example: { slug: "joao-silva" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Slug updated.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 409, 500]),
    },
  });

  // ============================================================================
  // GET /usuarios/slug/{slug} — public lookup by slug
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/slug/{slug}",
    tags: ["Users"],
    summary: "Look up a user by URL slug",
    description:
      "Public endpoint to fetch a user's profile by their slug. Returns the sanitized user profile (no sensitive fields). Used by `/usuarios/[slug]` pages.",
    request: {
      params: z.object({
        slug: z.string().openapi({ example: "joao-silva" }),
      }),
    },
    responses: {
      200: {
        description: "User profile.",
        content: { "application/json": { schema: userProfileSchema } },
      },
      ...errorResponses([404, 500]),
    },
  });

  // ============================================================================
  // POST /usuarios/facade — admin-only, create placeholder user
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/facade",
    tags: ["Users"],
    summary: "Create a facade user (admin only)",
    description:
      "Admin-only endpoint to create a placeholder ('facade') user — a user record without email or password, used to represent non-registered people (historical members, guest speakers, etc) in entity memberships. Facade users can later be merged into real users via POST /usuarios/merge-facade.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createFacadeUserSchema,
            example: {
              nome: "Maria Fictícia",
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
              cursoId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Facade user created.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  // ============================================================================
  // POST /usuarios/merge-facade — admin-only
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/merge-facade",
    tags: ["Users"],
    summary: "Merge a facade user into a real user (admin only)",
    description:
      "Admin-only endpoint to merge a facade user's memberships into a real user account. Membership conflicts (same user already in the same entity) are returned in the response. By default the facade user is deleted after merging — pass `deleteFacade: false` to retain the facade record.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: mergeFacadeUserSchema,
            example: {
              facadeUserId: "550e8400-e29b-41d4-a716-446655440000",
              realUserId: "661f9511-f30b-52e5-b827-557766551111",
              deleteFacade: true,
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Merge completed successfully.",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              membershipsCopied: z.number().int(),
              conflicts: z.array(z.string()),
              facadeUserDeleted: z.boolean(),
            }),
            example: {
              success: true,
              membershipsCopied: 3,
              conflicts: [],
              facadeUserDeleted: true,
            },
          },
        },
      },
      ...errorResponses([400, 401, 403, 500]),
    },
  });

  // ============================================================================
  // GET/PUT /usuarios/me/disciplinas — completed disciplines
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/disciplinas",
    tags: ["Users"],
    summary: "List completed disciplines for the current user",
    description:
      "Return the list of discipline IDs the authenticated user has marked as completed.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of completed discipline IDs.",
        content: {
          "application/json": {
            schema: z.object({ disciplinaIds: z.array(z.string().uuid()) }),
            example: {
              disciplinaIds: [
                "550e8400-e29b-41d4-a716-446655440000",
                "661f9511-f30b-52e5-b827-557766551111",
              ],
            },
          },
        },
      },
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/usuarios/me/disciplinas",
    tags: ["Users"],
    summary: "Replace the set of completed disciplines for the current user",
    description:
      "Replace the authenticated user's full set of completed disciplines in one request. Any disciplines not in the provided list will be removed from the completed set.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateCompletedDisciplinasSchema,
            example: {
              disciplinaIds: [
                "550e8400-e29b-41d4-a716-446655440000",
                "661f9511-f30b-52e5-b827-557766551111",
              ],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Completed disciplines updated.",
        content: {
          "application/json": {
            schema: z.object({ disciplinaIds: z.array(z.string().uuid()) }),
          },
        },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  // ============================================================================
  // POST /usuarios/me/disciplinas/marcar — mark with status
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/me/disciplinas/marcar",
    tags: ["Users"],
    summary: "Mark disciplines with a status (concluida, cursando, or none)",
    description:
      "Atomically mark a set of disciplines with a specific status. Uses the currently active semester as the context for the 'cursando' (in progress) status. Marking as 'cursando' removes a previous 'concluida' status on the same disciplines and vice versa. Status 'none' clears any existing marking.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: marcarDisciplinasSchema,
            example: {
              disciplinaIds: ["550e8400-e29b-41d4-a716-446655440000"],
              status: "cursando",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Disciplines marked successfully.",
        content: {
          "application/json": {
            schema: z.object({ ok: z.literal(true) }),
            example: { ok: true },
          },
        },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  // ============================================================================
  // GET/POST /usuarios/me/membros — current user's memberships
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/membros",
    tags: ["Users"],
    summary: "List the current user's memberships",
    description:
      "Return all entity memberships (active and historical) for the authenticated user.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "List of memberships for the authenticated user.",
        content: { "application/json": { schema: z.array(membershipResponseSchema) } },
      },
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/membros",
    tags: ["Users"],
    summary: "Join an entity as a member",
    description:
      "Create a new membership linking the authenticated user to an entity. Regular users can only join as `MEMBRO` — attempting to set `papel: 'ADMIN'` silently downgrades to `MEMBRO` unless the caller is a MASTER_ADMIN. Returns 409 if the user is already an active member of the target entity.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOwnMembershipSchema,
            example: {
              entidadeId: "550e8400-e29b-41d4-a716-446655440000",
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
        description: "Membership created.",
        content: { "application/json": { schema: membershipResponseSchema } },
      },
      ...errorResponses([400, 401, 404, 409, 500]),
    },
  });

  // ============================================================================
  // PUT/DELETE /usuarios/me/membros/{membroId}
  // ============================================================================
  registry.registerPath({
    method: "put",
    path: "/usuarios/me/membros/{membroId}",
    tags: ["Users"],
    summary: "Update one of the current user's memberships",
    description:
      "Update dates, cargo or papel on a membership. The membership must belong to the authenticated user — returns 403 otherwise. Non-admins cannot set `papel: 'ADMIN'` (silently ignored).",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ membroId: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateOwnMembershipSchema,
            example: { endedAt: "2026-12-31T23:59:59.000Z" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Membership updated.",
        content: { "application/json": { schema: membershipResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/usuarios/me/membros/{membroId}",
    tags: ["Users"],
    summary: "Delete one of the current user's memberships",
    description:
      "Permanently delete a membership. The membership must belong to the authenticated user — returns 403 otherwise.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ membroId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Membership deleted.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Membresia deletada com sucesso." },
          },
        },
      },
      ...errorResponses([401, 403, 404, 500]),
    },
  });

  // ============================================================================
  // GET/PATCH /usuarios/me/onboarding
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/onboarding",
    tags: ["Users"],
    summary: "Get the current user's onboarding progress",
    description:
      "Return the onboarding metadata object tracking which onboarding steps the user has completed or skipped. Returns an empty object if no onboarding has been started.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Onboarding metadata (may be empty).",
        content: {
          "application/json": {
            schema: onboardingPatchSchema,
            example: {
              welcome: { completedAt: "2026-01-15T12:00:00.000Z" },
              periodo: { completedAt: "2026-01-15T12:01:00.000Z" },
              concluidas: { skippedAt: "2026-01-15T12:02:00.000Z" },
            },
          },
        },
      },
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/onboarding",
    tags: ["Users"],
    summary: "Update the current user's onboarding progress",
    description:
      "Partial update of onboarding metadata. The request body is deep-merged with the existing metadata — only provided keys are updated. The `semesters` field is a map keyed by semester id, allowing per-semester tracking of 'cursando' and 'turmas' steps.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: onboardingPatchSchema,
            example: {
              concluidas: { completedAt: "2026-01-15T12:10:00.000Z" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Onboarding metadata updated.",
        content: { "application/json": { schema: onboardingPatchSchema } },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/me/periodo
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/periodo",
    tags: ["Users"],
    summary: "Update the current user's academic period",
    description:
      "Update the user's current semester (e.g., '5' for 5th semester, '12+' for 12+ semesters, 'graduado' for graduated). Pass null to clear the field.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updatePeriodoSchema,
            example: { periodoAtual: "5" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Period updated.",
        content: {
          "application/json": {
            schema: z.object({ periodoAtual: z.string().nullable() }),
            example: { periodoAtual: "5" },
          },
        },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  // ============================================================================
  // PATCH/DELETE /usuarios/me/photo
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/photo",
    tags: ["Users"],
    summary: "Update the current user's profile photo URL",
    description:
      "Update the profile photo URL for the authenticated user. The URL must point to an already-uploaded image — to upload a new image file, use POST /upload/photo instead (which handles upload + DB update atomically). The old photo is deleted from blob storage if it was hosted there.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updatePhotoSchema,
            example: {
              urlFotoPerfil: "https://blob.vercel-storage.com/photos/550e8400-1712668800.webp",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Photo updated.",
        content: { "application/json": { schema: userProfileSchema } },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/usuarios/me/photo",
    tags: ["Users"],
    summary: "Delete the current user's profile photo",
    description:
      "Remove the authenticated user's profile photo and delete the file from blob storage if it was hosted there.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Photo deleted.",
        content: { "application/json": { schema: userProfileSchema } },
      },
      ...errorResponses([401, 500]),
    },
  });

  // ============================================================================
  // GET/PUT /usuarios/me/semestres/{semestreId}/disciplinas — semestreId can be UUID or "ativo"
  // ============================================================================
  const semestreIdParam = z.object({
    semestreId: z.union([z.string().uuid(), z.literal("ativo")]).openapi({
      description:
        "Either a specific semester UUID, or the literal string 'ativo' to target the currently active semester.",
      example: "ativo",
    }),
  });

  registry.registerPath({
    method: "get",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas",
    tags: ["Users"],
    summary: "List the current user's enrolled disciplines for a semester",
    description:
      "Return the disciplines the authenticated user is currently enrolled in for the specified semester. The `semestreId` path parameter accepts either a UUID (for a specific semester) or the literal string `'ativo'`, which auto-resolves to the currently active semester.",
    security: [{ bearerAuth: [] }],
    request: { params: semestreIdParam },
    responses: {
      200: {
        description:
          "Enrolled disciplines for the semester. Returns `{ semestreLetivoId: null, disciplinas: [] }` when `semestreId='ativo'` but no semester is currently active.",
        content: { "application/json": { schema: semestreDisciplinasResponseSchema } },
      },
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas",
    tags: ["Users"],
    summary: "Replace enrolled disciplines for a semester",
    description:
      "Replace the authenticated user's full set of enrolled disciplines for the specified semester. Disciplines are referenced by their PAAS `codigoDisciplina` and resolved to internal IDs server-side. Any codes that cannot be resolved are listed in `skippedCodigos` in the response. `semestreId` accepts a UUID or the literal 'ativo'.",
    security: [{ bearerAuth: [] }],
    request: {
      params: semestreIdParam,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: saveSemestreDisciplinasSchema,
            example: {
              disciplinas: [
                {
                  codigoDisciplina: "DCE1001",
                  turma: "01",
                  docente: "Prof. Maria Santos",
                  horario: "24T34",
                  codigoPaas: 12345,
                },
              ],
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Enrolled disciplines replaced.",
        content: { "application/json": { schema: semestreDisciplinasResponseSchema } },
      },
      ...errorResponses([400, 401, 404, 500]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/me/semestres/{semestreId}/disciplinas/{disciplinaSemestreId}
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas/{disciplinaSemestreId}",
    tags: ["Users"],
    summary: "Update one of the user's enrolled disciplines for a semester",
    description:
      "Update the turma, docente, horario or codigoPaas fields on a specific enrolled discipline. The discipline must belong to the authenticated user and the specified semester. `semestreId` accepts a UUID or 'ativo'.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        semestreId: z.union([z.string().uuid(), z.literal("ativo")]),
        disciplinaSemestreId: z.string().uuid(),
      }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: updateDisciplinaSemestreSchema,
            example: { turma: "02", docente: "Prof. João Costa" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Discipline updated.",
        content: { "application/json": { schema: disciplinaSemestreResponseSchema } },
      },
      ...errorResponses([400, 401, 404, 500]),
    },
  });
}
