export type DisciplinaSearchResult = {
  id: string;
  codigo: string;
  nome: string;
};

export type DisciplinaRelacoesResponse = {
  preRequisitos: string[];
  dependentes: string[];
};

export type IDisciplinaRepository = {
  search(query: string, limit?: number): Promise<DisciplinaSearchResult[]>;
  findByCodigos(codigos: string[]): Promise<{ id: string; codigo: string }[]>;
  getRelacoes(codigo: string): Promise<DisciplinaRelacoesResponse>;
};
