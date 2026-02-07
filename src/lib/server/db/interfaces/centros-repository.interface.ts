import type { Centro } from "./types";

export type ICentrosRepository = {
  findById(id: string): Promise<Centro | null>;
  findMany(): Promise<Centro[]>;
  create(data: {
    nome: string;
    sigla: string;
    descricao: string | null;
    campusId: string;
  }): Promise<Centro>;
  update(
    id: string,
    data: { nome: string; sigla: string; descricao: string | null; campusId?: string }
  ): Promise<Centro | null>;
  delete(id: string): Promise<boolean>;
  countDependencies(id: string): Promise<{ cursos: number }>;
};
