import { Projeto, ProjetoAutor, Entidade, Usuario } from "@prisma/client";

export type UsuarioSummary = Pick<
  Usuario,
  "id" | "nome" | "email" | "urlFotoPerfil" | "slug" | "matricula"
>;
export type EntidadeSummary = Pick<Entidade, "id" | "nome" | "slug" | "tipo">;

/**
 * ProjetoAutor com dados do usuário
 */
export type ProjetoAutorWithUsuario = ProjetoAutor & {
  usuario: UsuarioSummary;
};

/**
 * Projeto com autores populados
 */
export type ProjetoWithAutores = Projeto & {
  autores: ProjetoAutorWithUsuario[];
  entidade?: EntidadeSummary | null;
};

/**
 * Projeto com contagem de autores
 */
export type ProjetoWithCount = Projeto & {
  _count: {
    autores: number;
  };
};

/**
 * Response para listagem paginada de projetos
 */
export interface ProjetosListResponse {
  projetos: ProjetoWithAutores[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
