/**
 * Mock for content/aquario-mapas/centro-de-informatica/professores
 * Used in tests to avoid loading actual content submodule files
 */

import type { Professor } from "@/lib/mapas/types";

export const professors: Professor[] = [
  {
    id: "test-professor-1",
    name: "Professor Test One",
    department: "Test Department",
  },
  {
    id: "test-professor-2",
    name: "Professor Test Two",
    department: "Test Department",
  },
];
