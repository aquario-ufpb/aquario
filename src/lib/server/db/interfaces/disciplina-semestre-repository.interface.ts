import type { DisciplinaSemestre } from "@prisma/client";

export type { DisciplinaSemestre };

export type CreateDisciplinaSemestreInput = {
  disciplinaId: string;
  turma?: string | null;
  docente?: string | null;
  horario?: string | null;
  codigoPaas?: number | null;
};

export type IDisciplinaSemestreRepository = {
  findByUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string
  ): Promise<DisciplinaSemestre[]>;

  replaceForUsuarioAndSemestre(
    usuarioId: string,
    semestreLetivoId: string,
    records: CreateDisciplinaSemestreInput[]
  ): Promise<DisciplinaSemestre[]>;
};
