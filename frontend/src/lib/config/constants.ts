import { API_CONFIG } from "./env";

export const API_URL = API_CONFIG.BASE_URL;

export const ENDPOINTS = {
  CENTROS: "/centros",
  CURSOS: (centroId: string) => `/centros/${centroId}/cursos`,
  GUIAS: (cursoId: string) => `/guias?cursoId=${cursoId}`,
  SECOES: (guiaId: string) => `/guias/${guiaId}/secoes?guiaId=${guiaId}`,
  SUBSECOES: (secaoId: string) => `/guias/secoes/${secaoId}/subsecoes?secaoId=${secaoId}`,
  // Auth endpoints
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verificar-email",
  RESEND_VERIFICATION: "/reenviar-verificacao",
  REQUEST_RESEND_VERIFICATION: "/solicitar-reenvio-verificacao",
  FORGOT_PASSWORD: "/esqueci-senha",
  RESET_PASSWORD: "/resetar-senha",
  REFRESH: "/refresh",
  ME: "/me",
  USUARIOS: "/usuarios",
  ENTIDADES: "/entidades",
  ENTIDADE_BY_SLUG: (slug: string) => `/entidades/slug/${slug}`,
  ENTIDADE_BY_ID: (id: string) => `/entidades/${id}`,
} as const;

// External API URLs
export const EXTERNAL_API_URLS = {
  PAAS: "https://sa.ci.ufpb.br/api/paas/center",
} as const;
