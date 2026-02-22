export const queryKeys = {
  campus: {
    all: ["campus"] as const,
  },
  guias: {
    all: ["guias"] as const,
    secoes: (guiaId: string) => ["guias", "secoes", guiaId] as const,
    subSecoes: (secaoId: string) => ["guias", "subSecoes", secaoId] as const,
  },
  cursos: {
    all: ["cursos"] as const,
    byCentro: (centroId: string) => ["cursos", "centro", centroId] as const,
  },
  centros: {
    all: ["centros"] as const,
  },
  paas: {
    center: (centerId: string) => ["paas", "center", centerId] as const,
  },
  mapas: {
    all: ["mapas"] as const,
  },
  usuarios: {
    all: ["usuarios"] as const,
    current: ["usuarios", "current"] as const,
    currentMemberships: ["usuarios", "current", "memberships"] as const,
    byId: (id: string) => ["usuarios", id] as const,
    bySlug: (slug: string) => ["usuarios", "slug", slug] as const,
    memberships: (userId: string) => ["usuarios", userId, "memberships"] as const,
    paginated: (options: { page?: number; limit?: number; filter?: string; search?: string }) =>
      [
        "usuarios",
        "paginated",
        options.page,
        options.limit,
        options.filter,
        options.search,
      ] as const,
    search: (query: string, limit?: number) => ["usuarios", "search", query, limit] as const,
  },
  entidades: {
    all: ["entidades"] as const,
    bySlug: (slug: string) => ["entidades", "slug", slug] as const,
    byTipo: (tipo: string) => ["entidades", "tipo", tipo] as const,
    cargos: (entidadeId: string) => ["entidades", entidadeId, "cargos"] as const,
  },
  projetos: {
    all: ["projetos"] as const,
    byEntidade: (entidadeId: string) => ["projetos", "entidade", entidadeId] as const,
    byUsuario: (usuarioId: string) => ["projetos", "usuario", usuarioId] as const,
    byEntidadeUsuario: (entidadeId: string, usuarioId: string) => [
      "projetos",
      "entidade",
      entidadeId,
      "usuario",
      usuarioId,
    ],
  },
  vagas: {
    all: ["vagas"] as const,
    byId: (id: string) => ["vagas", id] as const,
  },
  curriculos: {
    grade: (cursoId: string) => ["curriculos", "grade", cursoId] as const,
  },
  disciplinasConcluidas: {
    me: ["disciplinasConcluidas", "me"] as const,
  },
  calendarioAcademico: {
    all: ["calendarioAcademico"] as const,
    ativo: ["calendarioAcademico", "ativo"] as const,
    byId: (id: string) => ["calendarioAcademico", id] as const,
    eventos: (semestreId: string) => ["calendarioAcademico", semestreId, "eventos"] as const,
  },
} as const;
