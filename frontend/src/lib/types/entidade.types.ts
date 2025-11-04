export type TipoEntidade =
  | "LABORATORIO"
  | "CENTRO_ACADEMICO"
  | "ATLETICA"
  | "LIGA_ESTUDANTIL"
  | "GRUPO_ESTUDANTIL"
  | "OUTRO"
  | "EMPRESA";

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
  subtitle?: string | null;
  description?: string | null;
  tipo: TipoEntidade;
  imagePath: string;
  contato_email: string;
  instagram?: string | null;
  linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  founding_date?: string | null;
  people: Person[];
  order?: number | null;
};
