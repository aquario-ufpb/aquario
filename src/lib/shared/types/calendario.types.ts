export type { CategoriaEvento } from "@/lib/shared/config/calendario-academico";
import type { CategoriaEvento } from "@/lib/shared/config/calendario-academico";

export type EventoCalendario = {
  id: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  categoria: CategoriaEvento;
  semestreId: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type SemestreLetivo = {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type SemestreLetivoWithEventos = SemestreLetivo & {
  eventos: EventoCalendario[];
};
