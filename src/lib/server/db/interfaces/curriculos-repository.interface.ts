import type { GradeCurricularResponse } from "@/lib/shared/types";

export type ICurriculosRepository = {
  findActiveGradeByCursoId(cursoId: string): Promise<GradeCurricularResponse | null>;
};
