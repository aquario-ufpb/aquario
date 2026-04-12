import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  updateUserInfoSchema,
  updateRoleSchema,
  updateSlugSchema,
  createFacadeUserSchema,
  mergeFacadeUserSchema,
  updateCompletedDisciplinasSchema,
  marcarDisciplinasSchema,
  createOwnMembershipSchema,
  updateOwnMembershipSchema,
  onboardingPatchSchema,
  updatePeriodoSchema,
  updatePhotoSchema,
  saveSemestreDisciplinasSchema,
  updateDisciplinaSemestreSchema,
} from "@/lib/server/api-schemas/usuarios";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape de perfil de usuário retornado pelo mapper `formatUserResponse`.
 * Espelha a saída de src/lib/server/utils/format-user-response.ts — NÃO usar
 * o tipo Prisma `Usuario` direto (ele inclui campos sensíveis).
 *
 * Também usado por outros endpoints que retornam um usuário (PATCH /photo,
 * PATCH /slug, PATCH /info, POST /facade, etc).
 */
const userProfileSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    nome: z.string().openapi({ example: "João Silva" }),
    email: z.string().nullable().openapi({
      description: "Email do usuário. Null para usuários facade (placeholders criados por admins).",
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
      description: "Período atual (1–12, '12+' ou 'graduado'). Null até o usuário definir.",
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
 * Shape estendido de usuário que inclui o flag `eFacade`. Retornado pelos
 * endpoints exclusivos de admin (GET /usuarios, POST /facade) para que admins
 * possam distinguir usuários reais de placeholders facade.
 */
const adminUserResponseSchema = userProfileSchema
  .extend({
    eFacade: z.boolean().openapi({
      description: "Indica se este é um usuário facade (placeholder criado por admin, sem login).",
      example: false,
    }),
  })
  .openapi("AdminUserResponse");

/**
 * Resumo simplificado de entidade embutido nas respostas de membresia.
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
 * Cargo dentro de uma membresia de entidade.
 */
const cargoSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Tutor" }),
    descricao: z.string().nullable().optional(),
  })
  .openapi("Cargo");

/**
 * Shape de resposta de Membresia retornado pelos endpoints que listam ou
 * retornam membresias (/usuarios/{id}/membros, /usuarios/me/membros, etc).
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
 * Shape de resposta de DisciplinaSemestre retornado pelos endpoints de
 * disciplinas por semestre.
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
 * Envelope de GET/PUT /usuarios/me/semestres/{semestreId}/disciplinas.
 */
const semestreDisciplinasResponseSchema = z
  .object({
    semestreLetivoId: z.string().uuid().nullable(),
    disciplinas: z.array(disciplinaSemestreResponseSchema),
    skippedCodigos: z.array(z.string()).optional().openapi({
      description:
        "Códigos de disciplina que não puderam ser resolvidos para um registro válido e foram pulados (presente apenas em respostas de PUT quando aplicável).",
    }),
  })
  .openapi("SemestreDisciplinasResponse");

/**
 * Resposta simples com mensagem usada por endpoints DELETE e outras
 * confirmações de sucesso.
 */
const messageResponseSchema = z
  .object({ message: z.string() })
  .openapi({ description: "Resposta simples com mensagem de status." });

/** Registra os paths de usuários no registry OpenAPI. */
export function registerUsuariosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses, PaginationMetaSchema } = schemas;

  /**
   * Envelope de listagem paginada de usuários para GET /usuarios (com `?page`
   * e `?limit`). Definido dentro da função de registro para que possa
   * referenciar o `PaginationMetaSchema` compartilhado do registry atual —
   * construir no nível do módulo capturaria uma referência stale entre
   * múltiplas gerações de documento.
   */
  const paginatedUsersResponseSchema = z
    .object({
      users: z.array(adminUserResponseSchema),
      pagination: PaginationMetaSchema,
    })
    .openapi("PaginatedUsersResponse");
  // ============================================================================
  // GET /usuarios — listagem em três modos (ver documentação de edge cases)
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios",
    tags: ["Usuários"],
    summary: "Listar usuários (busca, paginado ou todos)",
    description:
      "Três modos:\n- `?search=X`: envelope com usuários que combinam (qualquer usuário autenticado)\n- `?page=N`: envelope paginado (apenas admin)\n- sem parâmetros: array bruto com todos os usuários (apenas admin)\n\nVerifique a presença da chave `pagination` para distinguir envelope de array.",
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        search: z.string().optional().openapi({
          description: "Termo de busca (usado nos modos search e paginado).",
          example: "joão",
        }),
        page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
        limit: z.coerce.number().int().positive().max(100).optional().openapi({ example: 25 }),
        filter: z.enum(["all", "facade", "real"]).optional().openapi({
          description:
            "Filtra por tipo de usuário: 'all' (padrão), 'facade' (usuários placeholder) ou 'real' (usuários normais com email).",
          example: "all",
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Usuários (envelope nos modos search/paginado, array no modo de listagem completa).",
        content: {
          "application/json": {
            schema: z.union([paginatedUsersResponseSchema, z.array(adminUserResponseSchema)]),
          },
        },
      },
      ...errorResponses([403], {
        403: {
          message: "Acesso negado. Permissão de administrador necessária.",
          code: "FORBIDDEN",
        },
      }),
    },
  });

  // ============================================================================
  // DELETE /usuarios/{id} — apenas admin, impede auto-exclusão
  // ============================================================================
  registry.registerPath({
    method: "delete",
    path: "/usuarios/{id}",
    tags: ["Usuários"],
    summary: "Excluir um usuário (admin)",
    description: "Exclui uma conta de usuário. Admins não podem se auto-excluir (retorna 400).",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
      }),
    },
    responses: {
      200: {
        description: "Usuário excluído com sucesso.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Usuário deletado com sucesso." },
          },
        },
      },
      ...errorResponses([400, 404], {
        404: { message: "Usuário não encontrado", code: "USER_NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/info — apenas admin (atualiza centro/curso)
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/info",
    tags: ["Usuários"],
    summary: "Atualizar centro e/ou curso de um usuário (admin)",
    description:
      "Endpoint exclusivo para administradores. Corrige o centro e/ou curso de um usuário. Ambos os campos são opcionais — omita um campo para mantê-lo inalterado. Útil para corrigir cadastros feitos com dados errados.",
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
        description: "Dados do usuário atualizados.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Usuário não encontrado", code: "USER_NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // GET /usuarios/{id}/membros — lista membresias de um usuário (público)
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/{id}/membros",
    tags: ["Usuários"],
    summary: "Listar membresias de um usuário",
    description:
      "Retorna todas as membresias (ativas e históricas) do usuário especificado. Útil para exibir os vínculos de um usuário na página de perfil.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Lista de membresias do usuário.",
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
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/role — apenas admin, impede auto-rebaixamento
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/role",
    tags: ["Usuários"],
    summary: "Atualizar o papel de um usuário na plataforma (admin)",
    description:
      "Endpoint exclusivo para administradores. Promove ou rebaixa usuários entre USER e MASTER_ADMIN. Admins não podem alterar o próprio papel por este endpoint, para evitar lockout acidental.",
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
        description: "Papel atualizado com sucesso.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Usuário não encontrado", code: "USER_NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // PATCH /usuarios/{id}/slug — apenas admin
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/{id}/slug",
    tags: ["Usuários"],
    summary: "Atualizar o slug de um usuário (admin)",
    description:
      "Endpoint exclusivo para administradores. Altera o slug de URL do usuário. O slug é normalizado (trim e lowercase) no servidor. Envie null para remover o slug. Slugs são garantidos únicos (auto-resolve colisões).",
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
        description: "Slug atualizado.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // GET /usuarios/slug/{slug} — busca pública pelo slug
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/slug/{slug}",
    tags: ["Usuários"],
    summary: "Buscar um usuário pelo slug",
    description:
      "Retorna o perfil de um usuário pelo slug. Devolve o perfil sanitizado (sem campos sensíveis). Usado pelas páginas `/usuarios/[slug]`.",
    request: {
      params: z.object({
        slug: z.string().openapi({ example: "joao-silva" }),
      }),
    },
    responses: {
      200: {
        description: "Perfil do usuário.",
        content: { "application/json": { schema: userProfileSchema } },
      },
      ...errorResponses([404], {
        404: { message: "Usuário não encontrado", code: "USER_NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // POST /usuarios/facade — apenas admin, cria usuário placeholder
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/facade",
    tags: ["Usuários"],
    summary: "Criar um usuário facade (admin)",
    description:
      "Endpoint exclusivo para administradores. Cria um usuário placeholder ('facade') — um registro sem email nem senha, usado para representar pessoas não cadastradas (membros antigos, palestrantes convidados, etc) em membresias de entidades. Usuários facade podem ser posteriormente mesclados em usuários reais via POST /usuarios/merge-facade.",
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
        description: "Usuário facade criado.",
        content: { "application/json": { schema: adminUserResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Centro não encontrado", code: "NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // POST /usuarios/merge-facade — apenas admin
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/merge-facade",
    tags: ["Usuários"],
    summary: "Mesclar usuário facade em usuário real (admin)",
    description:
      "Endpoint exclusivo para administradores. Mescla as membresias de um usuário facade em uma conta de usuário real. Conflitos de membresia (mesmo usuário já em mesma entidade) são retornados na resposta. Por padrão, o usuário facade é excluído após a mesclagem — envie `deleteFacade: false` para manter o registro facade.",
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
        description: "Mesclagem realizada com sucesso.",
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
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // GET/PUT /usuarios/me/disciplinas — disciplinas concluídas
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/disciplinas",
    tags: ["Usuários"],
    summary: "Listar disciplinas concluídas do usuário atual",
    description:
      "Retorna a lista de IDs das disciplinas que o usuário autenticado marcou como concluídas.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Lista de IDs de disciplinas concluídas.",
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
    },
  });

  registry.registerPath({
    method: "put",
    path: "/usuarios/me/disciplinas",
    tags: ["Usuários"],
    summary: "Substituir o conjunto de disciplinas concluídas do usuário atual",
    description:
      "Substitui o conjunto completo de disciplinas concluídas do usuário autenticado em uma única requisição. Disciplinas não incluídas na lista enviada serão removidas do conjunto.",
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
        description: "Disciplinas concluídas atualizadas.",
        content: {
          "application/json": {
            schema: z.object({ disciplinaIds: z.array(z.string().uuid()) }),
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // POST /usuarios/me/disciplinas/marcar — marca com status
  // ============================================================================
  registry.registerPath({
    method: "post",
    path: "/usuarios/me/disciplinas/marcar",
    tags: ["Usuários"],
    summary: "Marcar disciplinas com um status (concluida, cursando ou none)",
    description:
      "Marca atomicamente um conjunto de disciplinas com um status específico. Usa o semestre ativo como contexto para o status 'cursando'. Marcar como 'cursando' remove um status 'concluida' anterior nas mesmas disciplinas e vice-versa. O status 'none' limpa qualquer marcação existente.",
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
        description: "Disciplinas marcadas com sucesso.",
        content: {
          "application/json": {
            schema: z.object({ ok: z.literal(true) }),
            example: { ok: true },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // GET/POST /usuarios/me/membros — membresias do usuário atual
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/membros",
    tags: ["Usuários"],
    summary: "Listar as membresias do usuário atual",
    description: "Retorna todas as membresias (ativas e históricas) do usuário autenticado.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Lista de membresias do usuário autenticado.",
        content: { "application/json": { schema: z.array(membershipResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/membros",
    tags: ["Usuários"],
    summary: "Entrar em uma entidade como membro",
    description:
      "Cria uma nova membresia vinculando o usuário autenticado a uma entidade. Usuários comuns só podem entrar como `MEMBRO` — tentar definir `papel: 'ADMIN'` é silenciosamente rebaixado para `MEMBRO`, exceto se quem chama for MASTER_ADMIN. Retorna 409 se o usuário já é membro ativo da entidade alvo.",
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
        description: "Membresia criada.",
        content: { "application/json": { schema: membershipResponseSchema } },
      },
      ...errorResponses([400, 404, 409], {
        404: { message: "Entidade não encontrada", code: "ENTIDADE_NOT_FOUND" },
        409: { message: "Este usuário já é membro ativo desta entidade", code: "ALREADY_MEMBER" },
      }),
    },
  });

  // ============================================================================
  // PUT/DELETE /usuarios/me/membros/{membroId}
  // ============================================================================
  registry.registerPath({
    method: "put",
    path: "/usuarios/me/membros/{membroId}",
    tags: ["Usuários"],
    summary: "Atualizar uma membresia do usuário atual",
    description:
      "Atualiza datas, cargo ou papel de uma membresia. A membresia deve pertencer ao usuário autenticado — retorna 403 caso contrário. Não-admins não podem definir `papel: 'ADMIN'` (silenciosamente ignorado).",
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
        description: "Membresia atualizada.",
        content: { "application/json": { schema: membershipResponseSchema } },
      },
      ...errorResponses([400, 403, 404], {
        403: {
          message: "Você só pode editar suas próprias membresias.",
          code: "FORBIDDEN",
        },
        404: { message: "Membresia não encontrada", code: "MEMBRO_NOT_FOUND" },
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/usuarios/me/membros/{membroId}",
    tags: ["Usuários"],
    summary: "Excluir uma membresia do usuário atual",
    description:
      "Exclui uma membresia permanentemente. A membresia deve pertencer ao usuário autenticado — retorna 403 caso contrário.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ membroId: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Membresia excluída.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Membresia deletada com sucesso." },
          },
        },
      },
      ...errorResponses([403, 404], {
        403: {
          message: "Você só pode deletar suas próprias membresias.",
          code: "FORBIDDEN",
        },
        404: { message: "Membresia não encontrada", code: "MEMBRO_NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // GET/PATCH /usuarios/me/onboarding
  // ============================================================================
  registry.registerPath({
    method: "get",
    path: "/usuarios/me/onboarding",
    tags: ["Usuários"],
    summary: "Obter o progresso de onboarding do usuário atual",
    description:
      "Retorna o objeto de metadata do onboarding, rastreando quais etapas o usuário já completou ou pulou. Retorna objeto vazio se nenhum onboarding foi iniciado.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Metadata do onboarding (pode estar vazio).",
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
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/onboarding",
    tags: ["Usuários"],
    summary: "Atualizar o progresso de onboarding do usuário atual",
    description:
      "Atualização parcial dos metadados de onboarding. O corpo da requisição é mesclado em profundidade (deep merge) com o existente — apenas as chaves enviadas são atualizadas. O campo `semesters` é um mapa indexado por ID de semestre, permitindo rastrear as etapas de 'cursando' e 'turmas' por semestre.",
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
        description: "Metadata do onboarding atualizado.",
        content: { "application/json": { schema: onboardingPatchSchema } },
      },
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // PATCH /usuarios/me/periodo
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/periodo",
    tags: ["Usuários"],
    summary: "Atualizar o período acadêmico do usuário atual",
    description:
      "Atualiza o período atual do usuário (ex: '5' para o 5º período, '12+' para 12 ou mais, 'graduado' para já formado). Envie null para limpar o campo.",
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
        description: "Período atualizado.",
        content: {
          "application/json": {
            schema: z.object({ periodoAtual: z.string().nullable() }),
            example: { periodoAtual: "5" },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  // ============================================================================
  // PATCH/DELETE /usuarios/me/photo
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/photo",
    tags: ["Usuários"],
    summary: "Atualizar a URL da foto de perfil do usuário atual",
    description:
      "Atualiza a URL da foto de perfil do usuário autenticado. A URL deve apontar para uma imagem já enviada — para fazer upload de um novo arquivo, use POST /upload/photo (que cuida do upload + atualização do banco atomicamente). A foto antiga é excluída do blob storage se estivesse hospedada lá.",
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
        description: "Foto atualizada.",
        content: { "application/json": { schema: userProfileSchema } },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/usuarios/me/photo",
    tags: ["Usuários"],
    summary: "Excluir a foto de perfil do usuário atual",
    description:
      "Remove a foto de perfil do usuário autenticado e exclui o arquivo do blob storage se estivesse hospedada lá.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Foto excluída.",
        content: { "application/json": { schema: userProfileSchema } },
      },
    },
  });

  // ============================================================================
  // GET/PUT /usuarios/me/semestres/{semestreId}/disciplinas — semestreId pode ser UUID ou "ativo"
  // ============================================================================
  /** Parâmetro de path que aceita UUID ou a string literal 'ativo'. */
  const semestreIdParam = z.object({
    semestreId: z.union([z.string().uuid(), z.literal("ativo")]).openapi({
      description:
        "Um UUID de semestre específico ou a string literal 'ativo' para mirar o semestre atualmente ativo.",
      example: "ativo",
    }),
  });

  registry.registerPath({
    method: "get",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas",
    tags: ["Usuários"],
    summary: "Listar disciplinas matriculadas no semestre (usuário atual)",
    description:
      "Retorna as disciplinas em que o usuário autenticado está matriculado no semestre especificado. O parâmetro `semestreId` aceita um UUID (para um semestre específico) ou a string literal `'ativo'`, que resolve automaticamente para o semestre ativo.",
    security: [{ bearerAuth: [] }],
    request: { params: semestreIdParam },
    responses: {
      200: {
        description:
          "Disciplinas matriculadas no semestre. Retorna `{ semestreLetivoId: null, disciplinas: [] }` quando `semestreId='ativo'` mas nenhum semestre está ativo.",
        content: { "application/json": { schema: semestreDisciplinasResponseSchema } },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas",
    tags: ["Usuários"],
    summary: "Substituir disciplinas matriculadas em um semestre",
    description:
      "Substitui o conjunto completo de disciplinas matriculadas do usuário autenticado para o semestre especificado. As disciplinas são referenciadas pelo `codigoDisciplina` do PAAS e resolvidas para IDs internos no servidor. Códigos que não puderem ser resolvidos aparecem em `skippedCodigos` na resposta. `semestreId` aceita um UUID ou a string 'ativo'.",
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
        description: "Disciplinas matriculadas substituídas.",
        content: { "application/json": { schema: semestreDisciplinasResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Semestre ativo não encontrado", code: "NOT_FOUND" },
      }),
    },
  });

  // ============================================================================
  // PATCH /usuarios/me/semestres/{semestreId}/disciplinas/{disciplinaSemestreId}
  // ============================================================================
  registry.registerPath({
    method: "patch",
    path: "/usuarios/me/semestres/{semestreId}/disciplinas/{disciplinaSemestreId}",
    tags: ["Usuários"],
    summary: "Atualizar uma disciplina matriculada do usuário no semestre",
    description:
      "Atualiza os campos turma, docente, horario ou codigoPaas de uma disciplina matriculada específica. A disciplina deve pertencer ao usuário autenticado e ao semestre informado. `semestreId` aceita um UUID ou 'ativo'.",
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
        description: "Disciplina atualizada.",
        content: { "application/json": { schema: disciplinaSemestreResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Disciplina do semestre não encontrada", code: "NOT_FOUND" },
      }),
    },
  });
}
