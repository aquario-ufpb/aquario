/**
 * Shared contract for parsing academic documents (e.g. SIGAA "Atestado de Matrícula")
 * into a normalized list of enrolled components, independent of the source format.
 */

export type DisciplinaTipo = "disciplina" | "atividade";

export type DisciplinaStatus = "matriculado";

export type NormalizedDisciplina = {
  codigo: string;
  periodo: string;
  nome: string;
  docente?: string;
  turma?: string;
  horario?: string;
  tipo: DisciplinaTipo;
  status: DisciplinaStatus;
};

export type AcademicDocumentAdapter = {
  /** Stable identifier for the adapter (used for diagnostics/telemetry). */
  readonly id: string;
  /** Returns true when this adapter recognizes the document text. */
  matches(text: string): boolean;
  /** Extracts the enrolled components from the document text. */
  parse(text: string): NormalizedDisciplina[];
};
