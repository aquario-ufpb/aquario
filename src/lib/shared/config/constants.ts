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
  USUARIO_BY_SLUG: (slug: string) => `/usuarios/slug/${slug}`,
  USUARIO_MEMBROS: (userId: string) => `/usuarios/${userId}/membros`,
  UPLOAD_PHOTO: "/upload/photo",
  USUARIO_PHOTO: "/usuarios/me/photo",
  USUARIO_MEMBROS_ME: "/usuarios/me/membros",
  MERGE_FACADE_USER: "/usuarios/merge-facade",

  // Admin CRUD
  CAMPUS: "/campus",
  CAMPUS_BY_ID: (id: string) => `/campus/${id}`,
  CENTRO_BY_ID: (id: string) => `/centros/${id}`,
  CURSOS_ALL: "/cursos",
  CURSO_BY_ID: (id: string) => `/cursos/${id}`,

  // Entidades
  ENTIDADES: "/entidades",
  ENTIDADE_BY_SLUG: (slug: string) => `/entidades/slug/${slug}`,
  ENTIDADE_BY_ID: (id: string) => `/entidades/${id}`,
  ENTIDADE_MEMBROS: (id: string) => `/entidades/${id}/membros`,
  ENTIDADE_MEMBRO: (id: string, membroId: string) => `/entidades/${id}/membros/${membroId}`,
  ENTIDADE_CARGOS: (id: string) => `/entidades/${id}/cargos`,
} as const;

// External API URLs
export const EXTERNAL_API_URLS = {
  PAAS: "https://sa.ci.ufpb.br/api/paas/center",
} as const;
