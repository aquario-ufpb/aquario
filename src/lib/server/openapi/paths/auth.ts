import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  loginSchema,
  registerSchema,
  verifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationRequestSchema,
} from "@/lib/server/api-schemas/auth";

import type { CommonSchemas } from "../common-schemas";

/**
 * Exemplo de JWT compartilhado entre as respostas de token. Truncado para
 * manter os exemplos renderizados legíveis — o token real é uma string opaca
 * bem mais longa.
 */
const EXAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature";

/**
 * Schema da resposta `{ token }` retornada pelos endpoints de login e refresh.
 */
const tokenResponseSchema = z
  .object({
    token: z.string().openapi({
      description: "Token JWT. Enviar no header `Authorization: Bearer <token>`.",
      example: EXAMPLE_JWT,
    }),
  })
  .openapi("TokenResponse");

/**
 * Resposta genérica `{ message }` usada por vários fluxos de autenticação que
 * não retornam dados estruturados (verificação, reset de senha, etc).
 */
const messageResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Mensagem de status legível, em português.",
      example: "Operação realizada com sucesso.",
    }),
  })
  .openapi("MessageResponse");

/**
 * Shape da resposta de POST /auth/register — inclui o ID do novo usuário e se
 * a verificação de email foi pulada (acontece automaticamente em
 * desenvolvimento/teste).
 */
const registerResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Cadastro realizado! Verifique seu email para ativar sua conta.",
    }),
    usuarioId: z.string().uuid().openapi({
      description: "UUID do usuário recém-criado.",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    verificado: z.boolean().openapi({
      description:
        "Indica se o usuário foi auto-verificado (true) ou se precisa verificar o email (false).",
      example: false,
    }),
  })
  .openapi("RegisterResponse");

/**
 * Shape da resposta de GET /auth/me — o perfil do usuário autenticado, com os
 * campos sensíveis (hash de senha, etc) removidos. Espelha o objeto retornado
 * por src/app/api/auth/me/route.ts.
 */
const currentUserResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    nome: z.string().openapi({ example: "João Silva" }),
    email: z.string().email().openapi({ example: "joao.silva@academico.ufpb.br" }),
    slug: z.string().nullable().openapi({ example: "joao-silva" }),
    papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]).openapi({
      description: "Papel global na plataforma: usuário comum ou administrador master.",
      example: "USER",
    }),
    eVerificado: z.boolean().openapi({ example: true }),
    urlFotoPerfil: z
      .string()
      .url()
      .nullable()
      .openapi({ example: "https://www.aquarioufpb.com/photos/joao.webp" }),
    centro: z
      .object({
        id: z.string().uuid(),
        nome: z.string().openapi({ example: "Centro de Informática" }),
        sigla: z.string().openapi({ example: "CI" }),
      })
      .openapi({ description: "Centro acadêmico do usuário." }),
    curso: z
      .object({
        id: z.string().uuid(),
        nome: z.string().openapi({ example: "Ciência da Computação" }),
      })
      .openapi({ description: "Curso do usuário." }),
    permissoes: z.array(z.string()).openapi({
      description: "Lista de strings de permissão derivadas dos papéis e vínculos do usuário.",
      example: ["entidade:admin:a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    }),
  })
  .openapi("CurrentUserResponse");

/**
 * Registra todos os paths de autenticação no registry OpenAPI.
 * Chamado por registerAllPaths() em paths/index.ts durante a geração do
 * documento.
 *
 * O argumento `schemas` carrega os schemas de componentes compartilhados e os
 * helpers registrados por `registerCommonSchemas` no mesmo registry — fazemos
 * destructuring para que o resto do arquivo possa usar `errorResponses` e
 * `ApiErrorBodySchema` com os nomes familiares.
 */
export function registerAuthPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses, ApiErrorBodySchema } = schemas;
  registry.registerPath({
    method: "post",
    path: "/auth/login",
    tags: ["Autenticação"],
    summary: "Login com email e senha",
    description:
      "Autentica com email e senha. Retorna um token JWT válido por 7 dias. Limitado a 5 tentativas/min por IP. Credenciais inválidas sempre retornam um 401 genérico para evitar enumeração de usuários.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: loginSchema,
            example: {
              email: "joao.silva@academico.ufpb.br",
              senha: "senhaSegura123",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Login realizado com sucesso.",
        content: {
          "application/json": {
            schema: tokenResponseSchema,
            example: { token: EXAMPLE_JWT },
          },
        },
      },
      429: {
        description:
          "Limite de requisições excedido — aguarde os segundos indicados em `Retry-After` antes de tentar novamente.",
        headers: {
          "Retry-After": {
            description: "Segundos até a janela de rate limit reabrir.",
            schema: { type: "integer", example: 42 },
          },
        },
        content: {
          "application/json": {
            schema: ApiErrorBodySchema,
            example: {
              message: "Muitas tentativas de login. Tente novamente em alguns segundos.",
              code: "RATE_LIMITED",
            },
          },
        },
      },
      ...errorResponses([400, 401], {
        401: { message: "Email ou senha incorretos", code: "INVALID_CREDENTIALS" },
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Autenticação"],
    summary: "Cadastrar uma nova conta",
    description:
      "Cria uma nova conta de usuário. Apenas domínios de email da UFPB (`*.ufpb.br`) são aceitos. Em produção, um email de verificação é enviado; em desenvolvimento (sem provider de email), usuários são auto-verificados.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: registerSchema,
            example: {
              nome: "João Silva",
              email: "joao.silva@academico.ufpb.br",
              senha: "senhaSegura123",
              centroId: "550e8400-e29b-41d4-a716-446655440000",
              cursoId: "661f9511-f30b-52e5-b827-557766551111",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Usuário criado com sucesso.",
        content: {
          "application/json": {
            schema: registerResponseSchema,
            example: {
              message: "Cadastro realizado! Verifique seu email para ativar sua conta.",
              usuarioId: "550e8400-e29b-41d4-a716-446655440000",
              verificado: false,
            },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/auth/me",
    tags: ["Autenticação"],
    summary: "Obter o usuário autenticado",
    description: "Retorna o perfil do usuário autenticado. Campos sensíveis nunca são incluídos.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Perfil do usuário autenticado.",
        content: {
          "application/json": {
            schema: currentUserResponseSchema,
            example: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              nome: "João Silva",
              email: "joao.silva@academico.ufpb.br",
              slug: "joao-silva",
              papelPlataforma: "USER",
              eVerificado: true,
              urlFotoPerfil: "https://www.aquarioufpb.com/photos/joao.webp",
              centro: {
                id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                nome: "Centro de Informática",
                sigla: "CI",
              },
              curso: {
                id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                nome: "Ciência da Computação",
              },
              permissoes: ["entidade:admin:a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    tags: ["Autenticação"],
    summary: "Renovar o token JWT atual",
    description: "Emite um novo token JWT para o usuário autenticado.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Novo token JWT válido.",
        content: {
          "application/json": {
            schema: tokenResponseSchema,
            example: { token: EXAMPLE_JWT },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/verificar-email",
    tags: ["Autenticação"],
    summary: "Verificar email usando token",
    description:
      "Consome um token de verificação enviado por email e marca o usuário como verificado.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: verifySchema,
            example: { token: "a1b2c3d4e5f6789012345678901234567890abcd" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Email verificado com sucesso.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Email verificado com sucesso." },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/esqueci-senha",
    tags: ["Autenticação"],
    summary: "Solicitar email de redefinição de senha",
    description:
      "Sempre retorna 200, independentemente do email estar cadastrado ou não, para evitar enumeração de usuários.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: forgotPasswordSchema,
            example: { email: "joao.silva@academico.ufpb.br" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Solicitação aceita.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: {
              message:
                "Se o email estiver cadastrado, você receberá um link para redefinir sua senha.",
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/resetar-senha",
    tags: ["Autenticação"],
    summary: "Redefinir senha usando token",
    description: "Consome um token de reset (enviado por email) e define uma nova senha.",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: resetPasswordSchema,
            example: {
              token: "a1b2c3d4e5f6789012345678901234567890abcd",
              novaSenha: "novaSenhaSegura123",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "Senha redefinida com sucesso. O usuário já pode fazer login com a nova senha.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Senha redefinida com sucesso." },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/reenviar-verificacao",
    tags: ["Autenticação"],
    summary: "Reenviar email de verificação (autenticado)",
    description:
      "Reenvia o email de verificação para o usuário autenticado. Para o fluxo sem autenticação, veja `/auth/solicitar-reenvio-verificacao`.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Email de verificação reenviado.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: { message: "Email de verificação reenviado." },
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/solicitar-reenvio-verificacao",
    tags: ["Autenticação"],
    summary: "Solicitar reenvio de verificação pelo email",
    description:
      "Fluxo de reenvio sem autenticação. Sempre retorna 200, independentemente do email existir (previne enumeração de usuários).",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: resendVerificationRequestSchema,
            example: { email: "joao.silva@academico.ufpb.br" },
          },
        },
      },
    },
    responses: {
      200: {
        description:
          "Solicitação aceita. Um email de verificação só é enviado se o endereço estiver cadastrado e ainda não verificado.",
        content: {
          "application/json": {
            schema: messageResponseSchema,
            example: {
              message:
                "Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.",
            },
          },
        },
      },
    },
  });
}
