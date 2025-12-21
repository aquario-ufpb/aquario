import type { Centro } from "./types";

export interface ICentrosRepository {
  /**
   * Find a centro by ID
   */
  findById(id: string): Promise<Centro | null>;

  /**
   * List all centros
   */
  findMany(): Promise<Centro[]>;
}

