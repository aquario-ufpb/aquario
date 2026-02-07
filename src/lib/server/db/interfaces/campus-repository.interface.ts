import type { Campus } from "./types";

export type ICampusRepository = {
  findById(id: string): Promise<Campus | null>;
  findByNome(nome: string): Promise<Campus | null>;
  findMany(): Promise<Campus[]>;
  create(data: { nome: string }): Promise<Campus>;
  update(id: string, data: { nome: string }): Promise<Campus | null>;
  delete(id: string): Promise<boolean>;
  countDependencies(id: string): Promise<{ centros: number }>;
};
