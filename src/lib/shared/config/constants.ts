/**
 * API Configuration
 *
 * All API calls go to the local Next.js API routes.
 */
export const API_URL = "/api";

export const ENDPOINTS = {
  // Data endpoints
  CENTROS: "/centros",
  CURSOS: (centroId: string) => `/centros/${centroId}/cursos`,
  GUIAS: (cursoId: string) => `/guias?cursoId=${cursoId}`,
  SECOES: (guiaId: string) => `/guias/${guiaId}/secoes`,
  SUBSECOES: (secaoId: string) => `/guias/secoes/${secaoId}/subsecoes`,

  // Auth endpoints
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verificar-email",
  RESEND_VERIFICATION: "/auth/reenviar-verificacao",
  REQUEST_RESEND_VERIFICATION: "/auth/solicitar-reenvio-verificacao",
  FORGOT_PASSWORD: "/auth/esqueci-senha",
  RESET_PASSWORD: "/auth/resetar-senha",
  REFRESH: "/auth/refresh",
  ME: "/auth/me",

  // User management
  USUARIOS: "/usuarios",
  UPLOAD_PHOTO: "/upload/photo",
  USUARIO_PHOTO: "/usuarios/me/photo",

  // Entidades
  ENTIDADES: "/entidades",
  ENTIDADE_BY_SLUG: (slug: string) => `/entidades/slug/${slug}`,
  ENTIDADE_BY_ID: (id: string) => `/entidades/${id}`,
} as const;

// External API URLs
export const EXTERNAL_API_URLS = {
  PAAS: "https://sa.ci.ufpb.br/api/paas/center",
} as const;
