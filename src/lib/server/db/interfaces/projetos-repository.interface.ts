import type { Projeto, ProjetoAutor, StatusProjeto } from "@prisma/client";

/**
 * Dados públicos do usuario referenciado por um autor
 * (sem PII como email/matrícula)
 */
export type ProjetoAutorUsuarioPublic = {
  id: string;
  nome: string;
  urlFotoPerfil: string | null;
  slug: string | null;
};

/**
 * Dados públicos da entidade referenciada por um autor
 */
export type ProjetoAutorEntidadePublic = {
  id: string;
  nome: string;
  slug: string | null;
  tipo: string;
  urlFoto: string | null;
};

/**
 * Linha de autor populada — usuario e/ou entidade podem estar presentes
 */
export type ProjetoAutorPublic = ProjetoAutor & {
  usuario: ProjetoAutorUsuarioPublic | null;
  entidade: ProjetoAutorEntidadePublic | null;
};

/**
 * Projeto com autores populados
 */
export type ProjetoWithRelations = Projeto & {
  autores: ProjetoAutorPublic[];
};

export type FindManyProjetosParams = {
  page: number;
  limit: number;
  status?: string;
  entidadeId?: string;
  usuarioId?: string;
  tags?: string;
  search?: string;
  /**
   * "PESSOAL" → only user-author projects (no entidade-author).
   * Other values match the TipoEntidade enum and filter by entidade.tipo of any autor.
   */
  tipoEntidade?: string;
  /**
   * If set, additionally restrict results to projects where the caller is an
   * autor (usuarioId) OR the caller is admin of an entidade-author. Used to
   * scope non-PUBLICADO listings to the calling user's own work.
   */
  visibleToUserId?: string;
  visibleToEntidadeIds?: string[];
  /**
   * When true, the entidade leg of the visibility OR also requires
   * `autorPrincipal=true`. Used by "Meus Publicados" so an admin of a
   * co-author entidade doesn't see the project as theirs — only when the
   * entidade is the principal author. The user leg is unaffected.
   */
  requireEntidadeAsPrincipal?: boolean;
  orderBy: string;
  order: string;
};

export type FindManyProjetosResult = {
  projetos: ProjetoWithRelations[];
  total: number;
};

/**
 * Dados para criação de autor no projeto
 */
export type CreateProjetoAutorInput = {
  usuarioId?: string | null;
  entidadeId?: string | null;
  autorPrincipal: boolean;
};

/**
 * Dados para criação/atualização de projeto
 */
export type CreateProjetoInput = {
  titulo: string;
  slug: string;
  subtitulo?: string | null;
  textContent?: string | null;
  urlImagem?: string | null;
  status?: string;
  tags?: string[];
  dataInicio?: Date | null;
  dataFim?: Date | null;
  urlRepositorio?: string | null;
  urlDemo?: string | null;
  urlOutro?: string | null;
};

export type IProjetosRepository = {
  findMany(params: FindManyProjetosParams): Promise<FindManyProjetosResult>;

  findBySlug(slug: string): Promise<ProjetoWithRelations | null>;

  slugExists(slug: string): Promise<boolean>;

  /** Verifica se todos os IDs de usuário existem */
  usuariosExist(ids: string[]): Promise<boolean>;

  /** Verifica se todos os IDs de entidade existem */
  entidadesExist(ids: string[]): Promise<boolean>;

  create(
    data: CreateProjetoInput,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations>;

  update(slug: string, data: Partial<CreateProjetoInput>): Promise<ProjetoWithRelations>;

  updateStatus(
    slug: string,
    status: StatusProjeto,
    publicadoEm: Date | null
  ): Promise<ProjetoWithRelations>;

  replaceAutores(
    projetoId: string,
    slug: string,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations | null>;

  findBySlugWithAutores(slug: string): Promise<(Projeto & { autores: ProjetoAutor[] }) | null>;

  /**
   * Returns up to `limit` PUBLICADO projetos most similar to the source,
   * scored by overlap of tags and shared autores (usuario/entidade).
   * Excludes the source itself. Empty array when no overlap exists.
   */
  findSimilar(projetoId: string, limit: number): Promise<ProjetoWithRelations[]>;
};
