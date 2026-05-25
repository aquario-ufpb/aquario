export type Guia = {
  id: string;
  titulo: string;
  slug: string;
  descricao?: string | null;
  status: string;
  cursoId?: string | null;
  tags: string[];
};

export type Secao = {
  id: string;
  guiaId: string;
  titulo: string;
  slug: string;
  ordem: number;
  conteudo?: string | null;
  status: string;
};

export type SubSecao = {
  id: string;
  secaoId: string;
  titulo: string;
  slug: string;
  ordem: number;
  conteudo?: string | null;
  status: string;
};

// Tree structure for the sidebar
export type GuiaTree = {
  titulo: string;
  slug: string;
  secoes: SecaoTree[];
};

type SecaoTree = {
  titulo: string;
  slug: string;
  subsecoes: SubSecaoTree[];
};

type SubSecaoTree = {
  titulo: string;
  slug: string;
};
