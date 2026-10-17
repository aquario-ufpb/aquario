import { buildAcademicContext } from "../academic-context";
import { curriculumSearchCodes } from "../search-codes";
import type { GradeCurricularResponse } from "../../types/curriculo.types";

it("queries every pending level-zero elective from the curriculum without needing a SIGAA component or priority", () => {
  const grade: GradeCurricularResponse = {
    curriculoId: "grade",
    curriculoCodigo: "2024",
    cursoId: "course",
    cursoNome: "Course",
    disciplinas: Array.from({ length: 45 }, (_, index) => ({
      id: String(index),
      disciplinaId: String(index),
      codigo: `OPT${index}`,
      nome: `Optativa ${index}`,
      periodo: 0,
      natureza: "OPTATIVA",
      cargaHorariaTotal: 60,
      cargaHorariaTeoria: 60,
      cargaHorariaPratica: 0,
      departamento: null,
      modalidade: null,
      ementa: null,
      preRequisitos: [],
      equivalencias: index === 0 ? ["EQ1"] : [],
    })),
  };
  const academic = buildAcademicContext(grade, null, ["OPT44"]);
  const codes = curriculumSearchCodes(academic.goals);
  expect(codes).toHaveLength(45); // 44 pending electives plus the explicit equivalent.
  expect(codes).toEqual(expect.arrayContaining(Array.from({ length: 44 }, (_, i) => `OPT${i}`)));
  expect(codes).toContain("EQ1");
  expect(codes).not.toContain("OPT44");
  expect(academic.goals.every(goal => goal.period === 0 && goal.curricularRequired === false)).toBe(
    true
  );
});
