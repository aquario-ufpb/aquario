import { Projeto, ProjetoAutor, Entidade, Usuario } from '@prisma/client';

/**
 * ProjetoAutor com dados do usuário
 */
export type ProjetoAutorWithUsuario = ProjetoAutor & {
  usuario: Usuario;
};

/**
 * Projeto com autores populados
 */
export type ProjetoWithAutores = Projeto & {
  autores: ProjetoAutorWithUsuario[];
  entidade?: Entidade | null;
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
