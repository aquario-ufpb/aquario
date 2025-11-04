export type TipoEntidade = "LABORATORIO" | "GRUPO_PESQUISA" | "LIGA_ACADEMICA" | "OUTRO";

export type Person = {
  name: string;
  email: string;
  role: string;
  profession: string;
};

export type Entidade = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  tipo: TipoEntidade;
  imagePath: string;
  contato_email: string;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  people: Person[];
};
