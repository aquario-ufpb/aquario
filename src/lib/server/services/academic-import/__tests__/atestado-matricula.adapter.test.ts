import fs from "fs";
import path from "path";

import { atestadoMatriculaAdapter } from "../atestado-matricula.adapter";
import { detectAdapter } from "../detect-document";
import type { NormalizedDisciplina } from "../document-adapter.interface";

const FIXTURE = fs.readFileSync(path.join(__dirname, "fixtures", "atestado-sample.txt"), "utf-8");

const EXPECTED_CODIGOS_IN_ORDER = [
  "GDSCO0043",
  "DINF00053",
  "DSCO00023",
  "1404138",
  "GDLPL0063",
  "DSCO00022",
  "DINF00070",
];

function parse(): NormalizedDisciplina[] {
  return atestadoMatriculaAdapter.parse(FIXTURE);
}

function byCodigo(codigo: string): NormalizedDisciplina {
  const found = parse().find(d => d.codigo === codigo);
  if (!found) {
    throw new Error(`Component ${codigo} not parsed`);
  }
  return found;
}

describe("atestadoMatriculaAdapter.parse", () => {
  it("parses exactly 7 components", () => {
    expect(parse()).toHaveLength(7);
  });

  it("extracts códigos in document order (alpha and numeric)", () => {
    expect(parse().map(d => d.codigo)).toEqual(EXPECTED_CODIGOS_IN_ORDER);
  });

  it("marks every component as matriculado", () => {
    expect(parse().every(d => d.status === "matriculado")).toBe(true);
  });

  it("uses período 2026.1 for every component", () => {
    expect(parse().every(d => d.periodo === "2026.1")).toBe(true);
  });

  it("captures turma 01 for every component", () => {
    expect(parse().every(d => d.turma === "01")).toBe(true);
  });

  it("captures the single-line horário token", () => {
    expect(byCodigo("GDSCO0043").horario).toBe("24T23");
  });

  it("classifies the UCE component as an atividade with no horário", () => {
    const atividade = byCodigo("DINF00070");
    expect(atividade.tipo).toBe("atividade");
    expect(atividade.horario).toBeUndefined();
  });

  it("classifies the remaining components as disciplinas", () => {
    const disciplinas = parse().filter(d => d.codigo !== "DINF00070");
    expect(disciplinas.every(d => d.tipo === "disciplina")).toBe(true);
  });

  it("joins a horário split across two lines", () => {
    expect(byCodigo("1404138").horario).toBe("7M1 35N34");
  });

  it("extracts docente and nome for a single-line block", () => {
    const compiladores = byCodigo("GDSCO0043");
    expect(compiladores.docente).toBe("ANDREI DE ARAUJO FORMIGA");
    expect(compiladores.nome).toBe("CONSTRUÇÃO DE COMPILADORES I");
  });

  it("joins a multi-line discipline name", () => {
    expect(byCodigo("DSCO00023").nome).toContain(
      "INOVAÇÃO DE BASE CIENTÍFICA-TECNOLÓGICA E EMPREENDEDORISMO"
    );
  });

  it("joins a multi-line, multi-docente list", () => {
    const docente = byCodigo("DINF00070").docente ?? "";
    expect(docente).toContain("GIORGIA DE OLIVEIRA MATTOS");
    expect(docente).toContain("YUSKA PAOLA COSTA AGUIAR");
  });
});

describe("atestadoMatriculaAdapter.matches", () => {
  it("matches the header-inclusive Atestado fixture", () => {
    expect(atestadoMatriculaAdapter.matches(FIXTURE)).toBe(true);
  });

  it("does not match a Histórico Escolar even with shared structural cues", () => {
    const historico = [
      "Sistema Integrado de Gestão de Atividades Acadêmicas",
      "Portal do Discente",
      "Histórico Escolar",
      "Componentes Curriculares",
      "Conceito",
      "GDSCO0043 CONSTRUÇÃO DE COMPILADORES I MATRICULADO",
    ].join("\n");
    expect(atestadoMatriculaAdapter.matches(historico)).toBe(false);
  });
});

describe("detectAdapter", () => {
  it("selects the atestado adapter for the fixture", () => {
    const adapter = detectAdapter(FIXTURE, [atestadoMatriculaAdapter]);
    expect(adapter).toBe(atestadoMatriculaAdapter);
  });

  it("returns null for unrelated text", () => {
    const adapter = detectAdapter("random pdf text", [atestadoMatriculaAdapter]);
    expect(adapter).toBeNull();
  });
});
