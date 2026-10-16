import type { ClassWithRoom } from "@/components/pages/calendario/types";
import type { DisciplinaSemestreResponse } from "@/lib/shared/types/disciplina-semestre.types";
import { matchesDisciplineCode, resolveEnrolledClasses } from "../resolve-enrolled-classes";
import { parseHorarioToSlots } from "../utils";

const discipline: DisciplinaSemestreResponse = {
  id: "enrollment",
  disciplinaId: "discipline",
  disciplinaCodigo: "1103180",
  disciplinaNome: "Séries e EDO",
  turma: "07",
  docente: null,
  horario: null,
  codigoPaas: 1,
  criadoEm: "2026-10-14T00:00:00Z",
};
const allocation = (id: number, turma = "07"): ClassWithRoom => ({
  id,
  codigo: "1103180",
  nome: "Séries e EDO",
  turma,
  horario: "35M23",
  docente: "",
  departamento: "DCOC",
  alunos: "",
  preferencias: [],
  pcd: 0,
  preAlocacao: null,
  paasRoomSolutionId: 1,
  room: { bloco: "CI", nome: "106" },
});

describe("personal calendar allocation", () => {
  it("recovers a replaced PAAS id only for the saved turma", () => {
    const result = resolveEnrolledClasses([discipline], [allocation(2), allocation(3, "01")], true);
    expect(result.classes.map(item => item.id)).toEqual([2]);
    expect(result.pending).toEqual([]);
  });
  it("does not choose between two candidates or use an id belonging to another discipline", () => {
    const result = resolveEnrolledClasses(
      [discipline],
      [allocation(2), allocation(3), { ...allocation(1), codigo: "OTHER" }],
      true
    );
    expect(result.classes).toEqual([]);
    expect(result.pending[0].reason).toContain("Selecione novamente");
  });
  it("keeps a saved timetable when the current allocation is missing", () => {
    const result = resolveEnrolledClasses([{ ...discipline, horario: "35M23" }], [], false);
    expect(result.classes[0].horario).toBe("35M23");
    expect(result.classes[0].room.nome).toBe("Sala a confirmar");
    expect(result.pending).toHaveLength(1);
  });
  it("does not join allocations from another semester", () => {
    expect(resolveEnrolledClasses([discipline], [allocation(1)], false).classes).toEqual([]);
  });
  it("does not replace an extraordinary enrollment with a same-number local turma", () => {
    const result = resolveEnrolledClasses(
      [{ ...discipline, codigoPaas: null, horario: "2T34" }],
      [allocation(2)],
      true
    );
    expect(result.classes[0].horario).toBe("2T34");
    expect(result.classes[0].room.nome).toBe("Sala a confirmar");
  });
  it("does not select a turma merely because a discipline has a single offer", () => {
    expect(
      resolveEnrolledClasses(
        [{ ...discipline, turma: null, codigoPaas: null }],
        [allocation(2)],
        true
      ).classes
    ).toEqual([]);
  });
  it("matches explicit combined SACI codes without fuzzy name matching", () => {
    expect(matchesDisciplineCode("GDCOC0106 / DSCO00023", " dsco00023 ")).toBe(true);
    expect(matchesDisciplineCode("1103180", "110318")).toBe(false);
  });
});

describe("schedule parsing", () => {
  it("keeps multiple blocks and Saturday, deduplicating repeated slots", () => {
    const slots = parseHorarioToSlots("35M23; 7N12 7N1");
    expect(slots).toHaveLength(6);
    expect(slots.filter(slot => slot.day === 7).map(slot => slot.startTime)).toEqual([
      "19:00",
      "19:50",
    ]);
  });
  it.each(["8M12", "2N6", "35M23 indefinido", "", "2M0"])(
    "does not silently partially parse %s",
    raw => {
      expect(parseHorarioToSlots(raw)).toEqual([]);
    }
  );
});
