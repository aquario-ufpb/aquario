import type { ProjetoWithRelations } from "@/lib/shared/types/projeto";
import type {
  Projeto,
  Publicador,
  Colaborador,
  TipoProjeto,
} from "@/components/shared/project-card";

/**
 * Maps a ProjetoWithRelations (API response) to the Projeto type used by ProjectCard.
 *
 * Author rows can reference a usuario, an entidade, or both. The "publicador"
 * shown on the card is derived from the autorPrincipal:
 *   - if the principal row has an entidade → entidade is the publicador (project type
 *     becomes the entidade's tipo)
 *   - otherwise → the usuario is the publicador (type is PESSOAL)
 */
export function mapProjetoToCard(p: ProjetoWithRelations): Projeto {
  const principal = p.autores.find(a => a.autorPrincipal) ?? p.autores[0];

  let publicador: Publicador;
  let tipo: TipoProjeto = "PESSOAL";

  if (principal?.entidade) {
    publicador = {
      id: principal.entidade.id,
      nome: principal.entidade.nome,
      slug: principal.entidade.slug ?? "",
      urlFotoPerfil: principal.entidade.urlFoto ?? null,
      tipo: "ENTIDADE",
      entidadeTipo: principal.entidade.tipo as Publicador["entidadeTipo"],
    };
    tipo = principal.entidade.tipo as TipoProjeto;
  } else if (principal?.usuario) {
    publicador = {
      id: principal.usuario.id,
      nome: principal.usuario.nome,
      slug: principal.usuario.slug ?? "",
      urlFotoPerfil: principal.usuario.urlFotoPerfil ?? null,
      tipo: "USUARIO",
    };
  } else {
    publicador = {
      id: "0",
      nome: "Desconhecido",
      slug: "",
      urlFotoPerfil: null,
      tipo: "USUARIO",
    };
  }

  // Colaboradores list: the user-authors (entidade-only rows aren't really
  // collaborators in the people-row sense)
  const colaboradores: Colaborador[] = p.autores.flatMap(a => {
    if (!a.usuario) {
      return [];
    }
    return [
      {
        id: a.usuario.id,
        nome: a.usuario.nome,
        slug: a.usuario.slug ?? a.usuario.id,
        urlFotoPerfil: a.usuario.urlFotoPerfil,
        autorPrincipal: a.autorPrincipal,
      },
    ];
  });

  return {
    id: p.slug,
    nome: p.titulo,
    descricao: p.descricao ?? "",
    imagem: p.urlImagem ?? null,
    tipo,
    tags: p.tags ?? [],
    criadoEm: new Date(p.criadoEm).toISOString(),
    publicador,
    colaboradores,
    linkRepositorio: p.urlRepositorio ?? undefined,
    linkPrototipo: p.urlDemo ?? undefined,
  };
}
