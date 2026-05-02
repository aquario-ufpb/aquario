import type {
  ProjetoWithRelations,
  ProjetoAutorPublic,
} from "@/lib/server/db/interfaces/projetos-repository.interface";

// Re-export repository types for convenience
export type { ProjetoWithRelations, ProjetoAutorPublic };

/**
 * Response para listagem paginada de projetos
 */
export type ProjetosListResponse = {
  projetos: ProjetoWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
