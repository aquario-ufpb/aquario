export type DisciplinaSearchResult = {
  id: string;
  codigo: string;
  nome: string;
};

export type IDisciplinaRepository = {
  search(query: string, limit?: number): Promise<DisciplinaSearchResult[]>;
  findByCodigos(codigos: string[]): Promise<{ id: string; codigo: string }[]>;
};
