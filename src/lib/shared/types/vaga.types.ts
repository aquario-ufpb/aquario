/**
 * Vaga (Job/Opportunity) type definitions
 */

import { EntidadeVagaType } from "@/lib/shared/constants/entity-types";

/**
 * Types of opportunities available
 */
export const TipoVaga = {
  ESTAGIO: "ESTAGIO",
  TRAINEE: "TRAINEE",
  VOLUNTARIO: "VOLUNTARIO",
  PESQUISA: "PESQUISA",
  CLT: "CLT",
  PJ: "PJ",
} as const;

export type TipoVaga = (typeof TipoVaga)[keyof typeof TipoVaga];

/**
 * Categories of entities that can post opportunities
 */
export type EntidadeVaga = EntidadeVagaType;

/**
 * Publisher information for an opportunity
 */
export type Publicador = {
  nome: string;
  urlFotoPerfil?: string | null;
};

/**
 * Job/Opportunity posting
 */
export type Vaga = {
  id: string;
  titulo: string;
  descricao: string;
  tipoVaga: TipoVaga;
  areas: string[];
  publicador: Publicador;
  criadoEm: string;
  entidade: EntidadeVaga;
  prazo: string;
  salario: string;
  sobreEmpresa: string;
  responsabilidades: string[];
  requisitos: string[];
  informacoesAdicionais: string;
  etapasProcesso: string[];
  linkVaga: string;
};
