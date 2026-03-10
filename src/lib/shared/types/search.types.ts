export type SearchResultKind =
  | "pagina"
  | "guia"
  | "entidade"
  | "vaga"
  | "disciplina"
  | "curso"
  | "usuario";

export type SearchResultPagina = {
  kind: "pagina";
  id: string;
  titulo: string;
  descricao: string;
  url: string;
};

export type SearchResultGuia = {
  kind: "guia";
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
};

export type SearchResultEntidade = {
  kind: "entidade";
  id: string;
  nome: string;
  slug: string | null;
  tipo: string;
};

export type SearchResultVaga = {
  kind: "vaga";
  id: string;
  titulo: string;
  tipoVaga: string;
};

export type SearchResultDisciplina = {
  kind: "disciplina";
  id: string;
  codigo: string;
  nome: string;
};

export type SearchResultCurso = {
  kind: "curso";
  id: string;
  nome: string;
};

export type SearchResultUsuario = {
  kind: "usuario";
  id: string;
  nome: string;
  slug: string | null;
  urlFotoPerfil: string | null;
};

export type SearchResultItem =
  | SearchResultPagina
  | SearchResultGuia
  | SearchResultEntidade
  | SearchResultVaga
  | SearchResultDisciplina
  | SearchResultCurso
  | SearchResultUsuario;

export type SearchResponse = {
  query: string;
  results: {
    paginas: SearchResultPagina[];
    guias: SearchResultGuia[];
    entidades: SearchResultEntidade[];
    vagas: SearchResultVaga[];
    disciplinas: SearchResultDisciplina[];
    cursos: SearchResultCurso[];
    usuarios: SearchResultUsuario[];
  };
};
