import type { SemestreLetivo, EventoCalendario, CategoriaEvento } from "@prisma/client";

export type { SemestreLetivo, EventoCalendario, CategoriaEvento };

export type SemestreLetivoWithEventos = SemestreLetivo & {
  eventos: EventoCalendario[];
};

export type CreateEventoInput = {
  descricao: string;
  dataInicio: Date;
  dataFim: Date;
  categoria: CategoriaEvento;
  semestreId: string;
};

export type UpdateEventoInput = {
  descricao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  categoria?: CategoriaEvento;
};

export type CreateSemestreInput = {
  nome: string;
  dataInicio: Date;
  dataFim: Date;
};

export type UpdateSemestreInput = {
  nome?: string;
  dataInicio?: Date;
  dataFim?: Date;
};

export type ICalendarioRepository = {
  // Semesters
  findAllSemestres(): Promise<SemestreLetivo[]>;
  findSemestreById(id: string): Promise<SemestreLetivoWithEventos | null>;
  findSemestreAtivo(): Promise<SemestreLetivo | null>;
  createSemestre(data: CreateSemestreInput): Promise<SemestreLetivo>;
  updateSemestre(id: string, data: UpdateSemestreInput): Promise<SemestreLetivo | null>;
  deleteSemestre(id: string): Promise<boolean>;

  // Events
  findEventosBySemestreId(semestreId: string): Promise<EventoCalendario[]>;
  createEvento(data: CreateEventoInput): Promise<EventoCalendario>;
  createEventosBatch(data: CreateEventoInput[]): Promise<number>;
  replaceEventosBatch(semestreId: string, data: CreateEventoInput[]): Promise<number>;
  updateEvento(id: string, data: UpdateEventoInput): Promise<EventoCalendario | null>;
  deleteEvento(id: string): Promise<boolean>;
  deleteEventosBySemestreId(semestreId: string): Promise<number>;
};
