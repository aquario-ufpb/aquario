import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

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
