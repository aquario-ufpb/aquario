import type { Projeto, ProjetoAutor, StatusProjeto } from "@prisma/client";

/**
 * Dados públicos do autor (usuario) retornados pelo repository
 * Sem PII (email, matrícula)
 */
export type ProjetoAutorPublic = ProjetoAutor & {
  usuario: {
    id: string;
    nome: string;
    urlFotoPerfil: string | null;
    slug: string | null;
  };
};

/**
 * Projeto com autores e entidade populados
 */
export type ProjetoWithRelations = Projeto & {
  autores: ProjetoAutorPublic[];
  entidade?: {
    id: string;
    nome: string;
    slug: string | null;
    tipo: string;
    urlFoto: string | null;
    website?: string | null;
    descricao?: string | null;
  } | null;
};

/**
 * Parâmetros para listagem paginada de projetos
 */
export type FindManyProjetosParams = {
  page: number;
  limit: number;
  status?: string;
  entidadeId?: string;
  usuarioId?: string;
  tags?: string;
  search?: string;
  orderBy: string;
  order: string;
};

/**
 * Resultado paginado de projetos
 */
export type FindManyProjetosResult = {
  projetos: ProjetoWithRelations[];
  total: number;
};

/**
 * Dados para criação de autor no projeto
 */
export type CreateProjetoAutorInput = {
  usuarioId: string;
  autorPrincipal: boolean;
};

/**
 * Dados para criação de projeto
 */
export type CreateProjetoInput = {
  titulo: string;
  slug: string;
  subtitulo?: string | null;
  descricao?: string | null;
  textContent?: string | null;
  tipoConteudo?: string;
  urlImagem?: string | null;
  status?: string;
  tags?: string[];
  dataInicio?: Date | null;
  dataFim?: Date | null;
  urlRepositorio?: string | null;
  urlDemo?: string | null;
  urlPublicacao?: string | null;
  entidadeId?: string | null;
};

export type IProjetosRepository = {
  /** Lista projetos com paginação e filtros */
  findMany(params: FindManyProjetosParams): Promise<FindManyProjetosResult>;

  /** Busca um projeto pelo slug com autores e entidade */
  findBySlug(slug: string): Promise<ProjetoWithRelations | null>;

  /** Verifica se um slug já existe */
  slugExists(slug: string): Promise<boolean>;

  /** Verifica se todos os usuários existem */
  usuariosExist(ids: string[]): Promise<boolean>;

  /** Cria um projeto com autores */
  create(
    data: CreateProjetoInput,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations>;

  /** Atualiza dados de um projeto (sem autores) */
  update(slug: string, data: Partial<CreateProjetoInput>): Promise<ProjetoWithRelations>;

  /** Remove um projeto */
  delete(slug: string): Promise<void>;

  /** Atualiza o status de publicação */
  updateStatus(
    slug: string,
    status: StatusProjeto,
    publicadoEm: Date | null
  ): Promise<ProjetoWithRelations>;

  /** Substitui todos os autores de um projeto */
  replaceAutores(
    projetoId: string,
    slug: string,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations | null>;

  /** Busca projeto pelo slug sem relações (para verificações rápidas) */
  findBySlugBasic(slug: string): Promise<Projeto | null>;

  /** Busca projeto pelo slug com autores (sem entidade completa, para validação de publicação) */
  findBySlugWithAutores(slug: string): Promise<(Projeto & { autores: ProjetoAutor[] }) | null>;
};
