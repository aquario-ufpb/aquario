import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

export type PublicUserResponse = {
  id: string;
  nome: string;
  slug: string | null;
  eFacade: boolean;
  urlFotoPerfil: string | null;
  centro: {
    id: string;
    nome: string;
    sigla: string;
  };
  curso: {
    id: string;
    nome: string;
  };
};

/**
 * Format a user object for API responses
 * Ensures consistent user data structure across all endpoints
 */
export function formatUserResponse(user: UsuarioWithRelations) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    slug: user.slug,
    papelPlataforma: user.papelPlataforma,
    eVerificado: user.eVerificado,
    urlFotoPerfil: user.urlFotoPerfil,
    periodoAtual: user.periodoAtual ?? null,
    centro: {
      id: user.centro.id,
      nome: user.centro.nome,
      sigla: user.centro.sigla,
    },
    curso: {
      id: user.curso.id,
      nome: user.curso.nome,
    },
    permissoes: user.permissoes,
  };
}

/**
 * Format a user object for public profile/search responses.
 * Omits private account and authorization fields such as email, role,
 * verification status, and explicit permissions.
 */
export function formatPublicUserResponse(user: UsuarioWithRelations): PublicUserResponse {
  return {
    id: user.id,
    nome: user.nome,
    slug: user.slug,
    eFacade: user.eFacade,
    urlFotoPerfil: user.urlFotoPerfil,
    centro: {
      id: user.centro.id,
      nome: user.centro.nome,
      sigla: user.centro.sigla,
    },
    curso: {
      id: user.curso.id,
      nome: user.curso.nome,
    },
  };
}
