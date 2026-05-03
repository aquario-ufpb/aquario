import type {
  SearchResultGuia,
  SearchResultEntidade,
  SearchResultVaga,
  SearchResultProjeto,
  SearchResultDisciplina,
  SearchResultCurso,
  SearchResultUsuario,
} from "@/lib/shared/types/search.types";

export type ISearchRepository = {
  searchGuias(query: string, limit: number): Promise<SearchResultGuia[]>;
  searchEntidades(query: string, limit: number): Promise<SearchResultEntidade[]>;
  searchVagas(query: string, limit: number): Promise<SearchResultVaga[]>;
  searchProjetos(query: string, limit: number): Promise<SearchResultProjeto[]>;
  searchDisciplinas(query: string, limit: number): Promise<SearchResultDisciplina[]>;
  searchCursos(query: string, limit: number): Promise<SearchResultCurso[]>;
  searchUsuarios(query: string, limit: number): Promise<SearchResultUsuario[]>;
};
