import type { Curso } from "./types";

export type ICursosRepository = {
  findById(id: string): Promise<Curso | null>;
  findByCentroId(centroId: string): Promise<Curso[]>;
  findAll(): Promise<Curso[]>;
  create(data: { nome: string; centroId: string }): Promise<Curso>;
  update(id: string, data: { nome: string; centroId: string }): Promise<Curso | null>;
  delete(id: string): Promise<boolean>;
  countDependencies(id: string): Promise<{ curriculos: number; guias: number; usuarios: number }>;
};
