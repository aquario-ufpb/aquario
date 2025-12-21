import type { Curso } from "./types";

export type ICursosRepository = {
  /**
   * Find a curso by ID
   */
  findById(id: string): Promise<Curso | null>;

  /**
   * Find all cursos by centro ID
   */
  findByCentroId(centroId: string): Promise<Curso[]>;
};
