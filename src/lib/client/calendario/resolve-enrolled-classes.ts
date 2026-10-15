import type { ClassWithRoom } from "@/components/pages/calendario/types";
import type { DisciplinaSemestreResponse } from "@/lib/shared/types/disciplina-semestre.types";
import { normalizeAcademicCode } from "@/lib/shared/sigaa/combine-academic-display";
import { parseHorarioToSlots } from "./utils";

export function matchesDisciplineCode(paasCode: string, disciplineCode: string): boolean {
  return paasCode
    .split("/")
    .some(code => normalizeAcademicCode(code) === normalizeAcademicCode(disciplineCode));
}

export type CalendarPendingItem = {
  disciplineId: string;
  name: string;
  reason: string;
};

/** Resolve an allocation without assuming that a PAAS id survives a new solution. */
export function resolveEnrolledClasses(
  disciplines: readonly DisciplinaSemestreResponse[],
  availableClasses: readonly ClassWithRoom[],
  allocationMatchesSemester: boolean
): { classes: ClassWithRoom[]; pending: CalendarPendingItem[] } {
  const classes = new Map<number, ClassWithRoom>();
  const pending: CalendarPendingItem[] = [];

  disciplines.forEach((discipline, index) => {
    const addPending = (reason: string) =>
      pending.push({
        disciplineId: discipline.id,
        name: discipline.disciplinaNome,
        reason,
      });
    const options = allocationMatchesSemester
      ? availableClasses.filter(item =>
          matchesDisciplineCode(item.codigo, discipline.disciplinaCodigo)
        )
      : [];
    const exact = options.find(
      item =>
        item.id === discipline.codigoPaas &&
        (!discipline.turma || item.turma.trim() === discipline.turma.trim())
    );
    const sameTurma =
      discipline.codigoPaas !== null && discipline.turma
        ? options.filter(item => item.turma.trim() === discipline.turma?.trim())
        : [];
    // A new id can only be recovered when the saved turma has one unambiguous candidate.
    const allocated = exact ?? (sameTurma.length === 1 ? sameTurma[0] : undefined);
    if (allocated && parseHorarioToSlots(allocated.horario).length > 0) {
      classes.set(allocated.id, allocated);
      if (!allocated.room.nome.trim()) {
        addPending("Sala a confirmar no SACI.");
      }
      return;
    }

    // Preserve the user's saved schedule even when an allocation disappears.
    if (discipline.horario && parseHorarioToSlots(discipline.horario).length > 0) {
      const id = -(index + 1);
      classes.set(id, {
        id,
        codigo: discipline.disciplinaCodigo,
        nome: discipline.disciplinaNome,
        turma: discipline.turma ?? "A definir",
        docente: discipline.docente ?? "",
        horario: discipline.horario,
        departamento: "",
        alunos: "",
        preferencias: [],
        pcd: 0,
        preAlocacao: null,
        paasRoomSolutionId: 0,
        room: { bloco: "", nome: "Sala a confirmar" },
      });
      addPending(
        discipline.codigoPaas === null
          ? "Horário cadastrado manualmente; sala a confirmar."
          : "Horário salvo exibido; confirme a turma e a sala na oferta atual do SACI."
      );
      return;
    }

    addPending(
      !allocationMatchesSemester
        ? "Alocação do SACI indisponível para este semestre."
        : allocated
          ? "Horário da turma não reconhecido; precisa de conferência."
          : discipline.horario
            ? "Horário salvo não reconhecido; precisa de conferência."
            : options.length === 0
              ? "Disciplina sem oferta no SACI deste semestre."
              : discipline.turma || discipline.codigoPaas !== null
                ? "Turma salva não identificada na oferta atual. Selecione novamente."
                : "Turma a definir. Selecione uma das opções disponíveis."
    );
  });

  return { classes: [...classes.values()], pending };
}
