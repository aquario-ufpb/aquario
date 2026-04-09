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
 * Shared JWT example used across token responses. Truncated to keep the
 * rendered examples readable — the real token is a long opaque string.
 */
const EXAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAifQ.signature";

/**
 * Schema for the `{ token }` response returned by login and refresh endpoints.
 */
const tokenResponseSchema = z
  .object({
    token: z.string().openapi({
      description: "JWT bearer token. Use it in the Authorization header as 'Bearer <token>'.",
      example: EXAMPLE_JWT,
    }),
  })
  .openapi("TokenResponse");

/**
 * Generic `{ message }` response used by several auth flows that do not
 * return structured data (verification, password reset, etc).
 */
const messageResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Human-readable status message, localized in Portuguese.",
      example: "Operação realizada com sucesso.",
    }),
  })
  .openapi("MessageResponse");

/**
 * Response shape for POST /auth/register — includes the new user id and whether
 * email verification was skipped (happens automatically in dev/test environments).
 */
const registerResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Cadastro realizado! Verifique seu email para ativar sua conta.",
    }),
    usuarioId: z.string().uuid().openapi({
      description: "UUID of the newly created user.",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    verificado: z.boolean().openapi({
      description: "Whether the user was auto-verified (true) or needs email verification (false).",
      example: false,
    }),
  })
  .openapi("RegisterResponse");

/**
 * Response shape for GET /auth/me — the authenticated user's profile with
 * sensitive fields (password hash, etc) stripped out. Matches the object
 * returned by src/app/api/auth/me/route.ts.
 */
const currentUserResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    nome: z.string().openapi({ example: "João Silva" }),
    email: z.string().email().openapi({ example: "joao.silva@academico.ufpb.br" }),
    slug: z.string().openapi({ example: "joao-silva" }),
    papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]).openapi({
      description: "Platform-wide role: regular user or master admin.",
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
      .openapi({ description: "User's academic center." }),
    curso: z
      .object({
        id: z.string().uuid(),
        nome: z.string().openapi({ example: "Ciência da Computação" }),
      })
      .openapi({ description: "User's course/major." }),
    permissoes: z.array(z.string()).openapi({
      description: "List of permission strings derived from the user's roles and memberships.",
      example: ["entidade:admin:a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    }),
  })
  .openapi("CurrentUserResponse");

/**
 * Register all authentication-related paths on the OpenAPI registry.
 * Called from registerAllPaths() in paths/index.ts during document generation.
 *
 * The `schemas` argument holds the shared component schemas and helpers
 * registered by `registerCommonSchemas` on the same registry — we destructure
 * it here so the rest of the file can use `errorResponses` and
 * `ApiErrorBodySchema` with the familiar names.
 */
export function registerAuthPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses, ApiErrorBodySchema } = schemas;
  registry.registerPath({
    method: "post",
    path: "/auth/login",
    tags: ["Auth"],
    summary: "Log in with email and password",
    description:
      "Authenticate with email and password. Returns a JWT bearer token valid for 7 days. Rate limited to 5 attempts/min per IP. Invalid credentials always return a generic 401 to prevent user enumeration.",
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
        description: "Login successful.",
        content: {
          "application/json": {
            schema: tokenResponseSchema,
            example: { token: EXAMPLE_JWT },
          },
        },
      },
      429: {
        description: "Rate limited — wait `Retry-After` seconds before retrying.",
        headers: {
          "Retry-After": {
            description: "Seconds until the rate limit window resets.",
            schema: { type: "integer", example: 42 },
          },
        },
        content: {
          "application/json": {
            schema: ApiErrorBodySchema,
          },
        },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Auth"],
    summary: "Register a new user account",
    description:
      "Create a new user account. Only UFPB email domains (`*.ufpb.br`) are accepted. In prod a verification email is sent; in dev (no email provider) users are auto-verified.",
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
        description: "User created successfully.",
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
      ...errorResponses([400, 409]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/auth/me",
    tags: ["Auth"],
    summary: "Get the currently authenticated user",
    description: "Return the authenticated user's profile. Sensitive fields are never included.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "The authenticated user's profile.",
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
    tags: ["Auth"],
    summary: "Refresh the current JWT token",
    description: "Issue a fresh JWT for the authenticated user.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "A new valid JWT token.",
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
    tags: ["Auth"],
    summary: "Verify an email address using a token",
    description: "Consume a verification token sent by email and mark the user as verified.",
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
        description: "Email verified successfully.",
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
    tags: ["Auth"],
    summary: "Request a password reset email",
    description:
      "Always returns 200, whether the email is registered or not, to prevent user enumeration.",
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
        description: "Request accepted.",
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
    tags: ["Auth"],
    summary: "Reset password using a reset token",
    description: "Consume a reset token (sent via email) and set a new password.",
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
        description: "Password reset successfully. The user can now log in with the new password.",
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
    tags: ["Auth"],
    summary: "Resend verification email (authenticated)",
    description:
      "Resend the verification email for the authenticated user. For the unauthenticated flow, see `/auth/solicitar-reenvio-verificacao`.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Verification email resent.",
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
    tags: ["Auth"],
    summary: "Request verification email resend by email address",
    description:
      "Unauthenticated resend flow. Always returns 200 regardless of whether the email exists (prevents user enumeration).",
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
          "Request accepted. A verification email is sent only if the address is registered and unverified.",
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
