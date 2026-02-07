export type NaturezaDisciplinaType = "OBRIGATORIA" | "OPTATIVA" | "COMPLEMENTAR_FLEXIVA";

export type GradeDisciplinaNode = {
  id: string;
  disciplinaId: string;
  codigo: string;
  nome: string;
  periodo: number;
  natureza: NaturezaDisciplinaType;
  cargaHorariaTotal: number | null;
  cargaHorariaTeoria: number | null;
  cargaHorariaPratica: number | null;
  departamento: string | null;
  modalidade: string | null;
  ementa: string | null;
  preRequisitos: string[];
  equivalencias: string[];
};

export type GradeCurricularResponse = {
  curriculoId: string;
  curriculoCodigo: string;
  cursoId: string;
  cursoNome: string;
  disciplinas: GradeDisciplinaNode[];
};
