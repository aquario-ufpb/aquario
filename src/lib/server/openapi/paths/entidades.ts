import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  updateEntidadeSchema,
  addMemberSchema,
  updateMemberSchema,
  createCargoSchema,
  updateCargoSchema,
} from "@/lib/server/api-schemas/entidades";

import type { CommonSchemas } from "../common-schemas";

/**
 * Enum dos tipos de entidade (LABORATORIO, GRUPO, etc). Espelha os valores
 * aceitos pelo campo `tipo` em updateEntidadeSchema.
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
      "Categoria da entidade. Grupos PET são modelados como 'GRUPO'. DCEs e centros acadêmicos usam 'CENTRO_ACADEMICO'.",
    example: "GRUPO",
  });

/**
 * Shape público de Entidade, retornado por GET /entidades, GET
 * /entidades/slug/{slug}, etc. Inclui o centro embutido e — quando carregada —
 * a lista de membros ativos.
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
 * Shape de resposta dos endpoints de membresia no escopo da entidade (POST/PUT
 * em /entidades/{id}/membros). Difere do shape no escopo do usuário em
 * `paths/usuarios.ts` porque aninha o usuário em vez da entidade.
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
 * Shape de Cargo retornado pelos endpoints de cargos.
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

/** Resposta simples com mensagem de status. */
const messageResponseSchema = z.object({ message: z.string() });

/**
 * Schema do corpo de PUT cargo. Diferente do POST (que usa `createCargoSchema`),
 * o handler de PUT espera `cargoId` no corpo junto com os campos de atualização.
 */
const updateCargoRequestSchema = updateCargoSchema
  .extend({
    cargoId: z.string().uuid().openapi({
      description: "ID do cargo a atualizar. Enviado no corpo (não na URL) em requisições PUT.",
    }),
  })
  .openapi("UpdateCargoRequest");

/** Registra os paths de entidades no registry OpenAPI. */
export function registerEntidadesPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/entidades",
    tags: ["Entidades"],
    summary: "Listar todas as entidades",
    description:
      "Retorna todas as entidades cadastradas (laboratórios, PETs, centros acadêmicos, empresas júnior, atléticas). Os resultados incluem o centro embutido, mas não a lista completa de membros — para isso use GET /entidades/slug/{slug} ou /entidades/{id}/membros.",
    responses: {
      200: {
        description: "Lista de todas as entidades.",
        content: { "application/json": { schema: z.array(entidadeResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/entidades/slug/{slug}",
    tags: ["Entidades"],
    summary: "Buscar uma entidade pelo slug",
    description:
      "Retorna o perfil completo de uma entidade (com membros) pelo slug da URL. Usado pelas páginas `/entidade/[slug]`.",
    request: {
      params: z.object({
        slug: z.string().openapi({ example: "pet-computacao" }),
      }),
    },
    responses: {
      200: {
        description: "Perfil da entidade com membros e cargos embutidos.",
        content: { "application/json": { schema: entidadeResponseSchema } },
      },
      ...errorResponses([404], {
        404: { message: "Entidade não encontrada", code: "ENTIDADE_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}",
    tags: ["Entidades"],
    summary: "Atualizar uma entidade",
    description:
      "Atualiza campos da entidade. Requer MASTER_ADMIN ou uma membresia ADMIN ativa na entidade.",
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
        description: "Entidade atualizada.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Entidade atualizada com sucesso." },
          },
        },
      },
      ...errorResponses([400, 404], {
        404: { message: "Entidade não encontrada", code: "ENTIDADE_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/entidades/{id}/membros",
    tags: ["Entidades"],
    summary: "Adicionar um membro à entidade",
    description:
      "Adiciona um usuário como membro. Requer MASTER_ADMIN ou ADMIN da entidade. Para o usuário entrar sozinho, use `POST /usuarios/me/membros`.",
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
        description: "Membro adicionado.",
        content: { "application/json": { schema: entidadeMembershipResponseSchema } },
      },
      ...errorResponses([400, 404, 409], {
        404: { message: "Entidade não encontrada", code: "ENTIDADE_NOT_FOUND" },
        409: {
          message: "Este usuário já é membro ativo desta entidade",
          code: "ALREADY_MEMBER",
        },
      }),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}/membros/{membroId}",
    tags: ["Entidades"],
    summary: "Atualizar um membro da entidade",
    description:
      "Atualiza um membro. Requer MASTER_ADMIN ou ADMIN da entidade. Para o próprio usuário se gerenciar, use `PUT /usuarios/me/membros/{membroId}`.",
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
        description: "Membro atualizado.",
        content: { "application/json": { schema: entidadeMembershipResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Membresia não encontrada", code: "MEMBRO_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/entidades/{id}/membros/{membroId}",
    tags: ["Entidades"],
    summary: "Remover um membro da entidade",
    description: "Exclui uma membresia. Requer MASTER_ADMIN ou ADMIN da entidade.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
        membroId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Membro removido.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Membresia deletada com sucesso." },
          },
        },
      },
      ...errorResponses([400, 404], {
        404: { message: "Membresia não encontrada", code: "MEMBRO_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/entidades/{id}/cargos",
    tags: ["Entidades"],
    summary: "Listar cargos de uma entidade",
    description:
      "Lista os cargos definidos para esta entidade. Usados como `cargoId` ao criar membresias.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de cargos.",
        content: { "application/json": { schema: z.array(cargoResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/entidades/{id}/cargos",
    tags: ["Entidades"],
    summary: "Criar um novo cargo para uma entidade",
    description: "Cria um novo cargo. Requer MASTER_ADMIN ou ADMIN da entidade.",
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
        description: "Cargo criado.",
        content: { "application/json": { schema: cargoResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Entidade não encontrada", code: "ENTIDADE_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/entidades/{id}/cargos",
    tags: ["Entidades"],
    summary: "Atualizar um cargo de uma entidade",
    description:
      "Atualiza um cargo. **Atenção:** `cargoId` vai no corpo, não na URL. Requer MASTER_ADMIN ou ADMIN da entidade.",
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
        description: "Cargo atualizado.",
        content: { "application/json": { schema: cargoResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Cargo não encontrado", code: "CARGO_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/entidades/{id}/cargos",
    tags: ["Entidades"],
    summary: "Excluir um cargo de uma entidade",
    description:
      "Exclui um cargo. **Atenção:** o ID do cargo é passado como query param `?cargoId=`, não na URL. Requer MASTER_ADMIN ou ADMIN da entidade.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        cargoId: z.string().uuid().openapi({
          description: "ID do cargo a excluir.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Cargo excluído.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Cargo deletado com sucesso." },
          },
        },
      },
      ...errorResponses([400, 404], {
        404: { message: "Cargo não encontrado", code: "CARGO_NOT_FOUND" },
      }),
    },
  });
}
