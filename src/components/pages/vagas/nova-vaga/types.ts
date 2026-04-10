import type { TipoVaga } from "@/lib/shared/types";

export type EntidadeOption = { id: string; nome: string; imagePath?: string };

export type VagaFormData = {
  titulo: string;
  descricao: string;
  tipoVaga: TipoVaga | "";
  entidadeId: string;
  areas: string[];
  linkInscricao: string;
  dataFinalizacao: string;
  salario: string;
  sobreEmpresa: string;
  responsabilidades: string[];
  requisitos: string[];
  etapasProcesso: string[];
  informacoesAdicionais: string;
};

export type VagaFormUpdater = <K extends keyof VagaFormData>(
  key: K,
  value: VagaFormData[K]
) => void;
