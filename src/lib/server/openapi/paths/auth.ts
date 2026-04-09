import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { loginSchema } from "@/app/api/auth/login/route";
import { registerSchema } from "@/app/api/auth/register/route";
import { verifySchema } from "@/app/api/auth/verificar-email/route";
import { forgotPasswordSchema } from "@/app/api/auth/esqueci-senha/route";
import { resetPasswordSchema } from "@/app/api/auth/resetar-senha/route";
import { resendVerificationRequestSchema } from "@/app/api/auth/solicitar-reenvio-verificacao/route";

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
      "Authenticate with email and password and receive a JWT bearer token. **Rate limited to 5 attempts per minute per IP address.** On rate limit exceeded, the response includes `X-RateLimit-*` headers and `Retry-After`. For security, this endpoint does not disclose whether the email exists — any invalid email/password combination returns a generic 401 response.",
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
        description: "Login successful. The returned token is valid for 7 days.",
        headers: {
          "X-RateLimit-Limit": {
            description: "Maximum number of login attempts allowed per minute per IP.",
            schema: { type: "integer", example: 5 },
          },
          "X-RateLimit-Remaining": {
            description: "Remaining login attempts in the current window.",
            schema: { type: "integer", example: 4 },
          },
          "X-RateLimit-Reset": {
            description: "Unix timestamp (ms) when the rate limit window resets.",
            schema: { type: "integer", example: 1712668800000 },
          },
        },
        content: {
          "application/json": {
            schema: tokenResponseSchema,
            example: { token: EXAMPLE_JWT },
          },
        },
      },
      429: {
        description: "Too many login attempts. Wait for `Retry-After` seconds before trying again.",
        headers: {
          "Retry-After": {
            description: "Number of seconds to wait before retrying.",
            schema: { type: "integer", example: 42 },
          },
          "X-RateLimit-Limit": { schema: { type: "integer", example: 5 } },
          "X-RateLimit-Remaining": { schema: { type: "integer", example: 0 } },
          "X-RateLimit-Reset": { schema: { type: "integer", example: 1712668800000 } },
        },
        content: {
          "application/json": {
            schema: ApiErrorBodySchema,
          },
        },
      },
      ...errorResponses([400, 401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/register",
    tags: ["Auth"],
    summary: "Register a new user account",
    description:
      "Create a new user account. In production environments, a verification email is sent and the user must click the link before logging in. In development environments (no email provider configured), the user is auto-verified and can log in immediately. Email addresses must belong to a UFPB domain (any subdomain of `.ufpb.br`).",
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
      ...errorResponses([400, 409, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/auth/me",
    tags: ["Auth"],
    summary: "Get the currently authenticated user",
    description:
      "Return the profile of the user whose bearer token is supplied. Sensitive fields (password hash, verification tokens, etc) are never included in the response.",
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
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    tags: ["Auth"],
    summary: "Refresh the current JWT token",
    description:
      "Issue a fresh JWT for the authenticated user without requiring email/password. Useful for extending sessions before the current token expires.",
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
      ...errorResponses([401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/verificar-email",
    tags: ["Auth"],
    summary: "Verify an email address using a token",
    description:
      "Consume a verification token sent by email (when registering or requesting a resend). On success, the user is marked as verified and can log in.",
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
      ...errorResponses([400, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/esqueci-senha",
    tags: ["Auth"],
    summary: "Request a password reset email",
    description:
      "Send a password reset email to the provided address if it exists in the system. **Returns 200 regardless of whether the email is registered** to prevent user enumeration attacks. Clients should never rely on the response to determine account existence.",
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
        description:
          "Request accepted. A reset email is sent only if the address is registered — clients should not interpret this response as confirmation that the account exists.",
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
    description:
      "Consume a password reset token (sent via email from /auth/esqueci-senha) and set a new password for the associated account.",
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
      ...errorResponses([400, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/reenviar-verificacao",
    tags: ["Auth"],
    summary: "Resend verification email (authenticated)",
    description:
      "Request a new verification email for the currently authenticated user. Use this when the original verification email was lost or expired. The user must be authenticated — for an unauthenticated flow, use POST /auth/solicitar-reenvio-verificacao instead.",
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
      ...errorResponses([400, 401, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/solicitar-reenvio-verificacao",
    tags: ["Auth"],
    summary: "Request verification email resend by email address",
    description:
      "Unauthenticated version of the resend flow: provide an email address and, if it corresponds to a registered but unverified account, a new verification email will be sent. **Returns 200 regardless of whether the email is registered** to prevent user enumeration attacks.",
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
