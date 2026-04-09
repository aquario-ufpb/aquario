import type { ProjetoWithRelations } from "@/lib/shared/types/projeto";
import type {
  Projeto,
  Publicador,
  Colaborador,
  TipoProjeto,
} from "@/components/shared/project-card";

/**
 * Maps a ProjetoWithRelations (API response) to the Projeto type used by ProjectCard.
 */
export function mapProjetoToCard(p: ProjetoWithRelations): Projeto {
  let publicador: Publicador;

  if (p.entidade) {
    publicador = {
      id: p.entidade.id,
      nome: p.entidade.nome,
      slug: p.entidade.slug ?? "",
      urlFotoPerfil: p.entidade.urlFoto ?? null,
      tipo: "ENTIDADE",
      entidadeTipo: p.entidade.tipo as Publicador["entidadeTipo"],
    };
  } else {
    const autorPrincipalObj = p.autores.find(a => a.autorPrincipal);
    const autorPrincipal = autorPrincipalObj?.usuario;

    publicador = {
      id: autorPrincipal?.id ?? "0",
      nome: autorPrincipal?.nome ?? "Usuário",
      slug: autorPrincipal?.slug ?? "",
      urlFotoPerfil: autorPrincipal?.urlFotoPerfil ?? null,
      tipo: "USUARIO",
    };
  }

  const colaboradores: Colaborador[] = p.autores.map(a => ({
    id: a.usuario.id,
    nome: a.usuario.nome,
    slug: a.usuario.slug ?? a.usuario.id,
    urlFotoPerfil: a.usuario.urlFotoPerfil,
    autorPrincipal: a.autorPrincipal,
  }));

  return {
    id: p.slug,
    nome: p.titulo,
    descricao: p.descricao ?? "",
    imagem: p.urlImagem ?? null,
    tipo: (p.entidade?.tipo ?? "PESSOAL") as TipoProjeto,
    tags: p.tags ?? [],
    criadoEm: new Date(p.criadoEm).toISOString(),
    publicador,
    colaboradores,
    linkRepositorio: p.urlRepositorio ?? undefined,
    linkPrototipo: p.urlDemo ?? undefined,
  };
}
