export type CategoriaEvento =
  | "MATRICULA_INGRESSANTES"
  | "MATRICULA_VETERANOS"
  | "REMATRICULA"
  | "MATRICULA_EXTRAORDINARIA"
  | "PONTO_FACULTATIVO"
  | "FERIADO"
  | "EXAMES_FINAIS"
  | "REGISTRO_MEDIAS_FINAIS"
  | "COLACAO_DE_GRAU"
  | "INICIO_PERIODO_LETIVO"
  | "TERMINO_PERIODO_LETIVO"
  | "OUTRA";

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
