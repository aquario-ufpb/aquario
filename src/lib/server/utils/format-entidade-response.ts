import type { Cargo } from "@prisma/client";
import type { EntidadeWithRelations } from "@/lib/server/db/interfaces/types";

export type PublicEntidadeResponse = Omit<EntidadeWithRelations, "membros"> & {
  membros?: Array<{
    id: string;
    entidadeId: string;
    papel: string;
    cargoId: string | null;
    startedAt: Date;
    endedAt: Date | null;
    cargo: Cargo | null;
    usuario: {
      id: string;
      nome: string;
      slug: string | null;
      eFacade: boolean;
      urlFotoPerfil: string | null;
      curso: { id: string; nome: string } | null;
    };
  }>;
};

/**
 * Strips private account fields (email, senhaHash, papelPlataforma,
 * eVerificado, permissoes, matricula, ...) from each member's nested
 * `usuario` before an entidade is returned by a public/unauthenticated
 * endpoint. The entidade repository's Prisma `include` pulls the full
 * Usuario row for each member — only the fields actually rendered by the
 * entity page (name, slug, avatar, curso) should ever leave the API.
 */
export function formatPublicEntidadeResponse(
  entidade: EntidadeWithRelations
): PublicEntidadeResponse {
  const { membros, ...rest } = entidade;
  return {
    ...rest,
    membros: membros?.map(membro => ({
      id: membro.id,
      entidadeId: membro.entidadeId,
      papel: membro.papel,
      cargoId: membro.cargoId,
      startedAt: membro.startedAt,
      endedAt: membro.endedAt,
      cargo: membro.cargo ?? null,
      usuario: {
        id: membro.usuario.id,
        nome: membro.usuario.nome,
        slug: membro.usuario.slug,
        eFacade: membro.usuario.eFacade,
        urlFotoPerfil: membro.usuario.urlFotoPerfil,
        curso: membro.usuario.curso
          ? { id: membro.usuario.curso.id, nome: membro.usuario.curso.nome }
          : null,
      },
    })),
  };
}
