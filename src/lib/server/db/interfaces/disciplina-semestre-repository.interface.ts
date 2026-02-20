import type { DisciplinaSemestre } from "@prisma/client";

export type { DisciplinaSemestre };

export type CreateDisciplinaSemestreInput = {
  disciplinaId: string;
  turma?: string | null;
  docente?: string | null;
  horario?: string | null;
  codigoPaas?: number | null;
};

export type DisciplinaSemestreWithDisciplina = DisciplinaSemestre & {
  disciplina: { codigo: string; nome: string };
};

export type UpdateDisciplinaSemestreFields = {
  turma?: string | null;
  docente?: string | null;
  horario?: string | null;
  codigoPaas?: number | null;
};

export type MarcarStatus = "concluida" | "cursando" | "none";

export type IDisciplinaSemestreRepository = {
  findByUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestre[]>;

  findByUsuarioAndSemestreWithDisciplina(
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestreWithDisciplina[]>;

  findOneOwned(
    id: string,
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestre | null>;

  updateFields(
    id: string,
    data: UpdateDisciplinaSemestreFields
  ): Promise<DisciplinaSemestreWithDisciplina>;

  replaceForUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string,
    records: CreateDisciplinaSemestreInput[]
  ): Promise<DisciplinaSemestre[]>;

  marcarDisciplinas(
    usuarioId: string,
    disciplinaIds: string[],
    status: MarcarStatus,
    semestreLetivoId: string | null
  ): Promise<void>;
};
