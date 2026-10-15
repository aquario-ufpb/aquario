import type { GradeCurricularResponse } from "@/lib/shared/types";

export type ICurriculosRepository = {
  findActiveGradeByCursoId(
    cursoId: string,
    codigo?: string
  ): Promise<GradeCurricularResponse | null>;
};
