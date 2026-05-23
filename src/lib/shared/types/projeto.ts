import type { ProjetoWithRelations } from "@/lib/server/db/interfaces/projetos-repository.interface";

export type { ProjetoWithRelations };

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
