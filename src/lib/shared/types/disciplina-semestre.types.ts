export type DisciplinaSemestreResponse = {
  id: string;
  disciplinaId: string;
  disciplinaCodigo: string;
  disciplinaNome: string;
  turma: string | null;
  docente: string | null;
  horario: string | null;
  codigoPaas: number | null;
  criadoEm: string;
};

export type SaveDisciplinasSemestreItem = {
  codigoDisciplina: string;
  turma?: string | null;
  docente?: string | null;
  horario?: string | null;
  codigoPaas?: number | null;
};

export type SaveDisciplinasSemestreRequest = {
  disciplinas: SaveDisciplinasSemestreItem[];
};

export type DisciplinasSemestreListResponse = {
  semestreLetivoId: string | null;
  disciplinas: DisciplinaSemestreResponse[];
};

export type MarcarDisciplinasRequest = {
  disciplinaIds: string[];
  status: "concluida" | "cursando" | "none";
};

export type PatchDisciplinaSemestreRequest = {
  turma?: string | null;
  docente?: string | null;
  horario?: string | null;
  codigoPaas?: number | null;
};

export type DisciplinaSearchResult = {
  id: string;
  codigo: string;
  nome: string;
};
