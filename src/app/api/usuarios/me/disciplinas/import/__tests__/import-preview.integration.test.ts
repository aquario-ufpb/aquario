import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { buildImportPreview } from "@/lib/server/services/academic-import/build-import-preview";

/**
 * Integration coverage for the academic-import parse pipeline.
 *
 * The fixture is the REAL pdf-parse output of an Atestado de Matrícula, produced
 * by the row-reconstructing extractor (`pdf-text-extractor.ts`) and then
 * sanitized (matrícula + name replaced). Driving the pipeline from this captured
 * output proves detect → parse → resolve → preview works against genuine
 * extraction, without committing the PDF binary or invoking pdf.js in tests.
 */

const FIXTURE_PATH = join(__dirname, "fixtures", "pdfparse-output-sample.txt");
const ATESTADO_TEXT = readFileSync(FIXTURE_PATH, "utf8");

const ALL_CODIGOS = [
  "GDSCO0043",
  "DINF00053",
  "DSCO00023",
  "1404138",
  "GDLPL0063",
  "DSCO00022",
  "DINF00070",
];

describe("buildImportPreview", () => {
  it("parses the real extracted Atestado into a preview with all 7 components matched", async () => {
    const findByCodigos = vi.fn((codigos: string[]) =>
      Promise.resolve(codigos.map(codigo => ({ id: `id-${codigo}`, codigo })))
    );

    const preview = await buildImportPreview(ATESTADO_TEXT, findByCodigos);

    expect(preview).not.toBeNull();
    expect(preview?.documento).toBe("atestado-matricula");
    expect(preview?.unknownCodigos).toEqual([]);
    expect(preview?.matched).toHaveLength(7);
    expect(preview?.matched.map(m => m.codigo)).toEqual(ALL_CODIGOS);

    // findByCodigos is called with exactly the parsed códigos.
    expect(findByCodigos).toHaveBeenCalledTimes(1);
    expect(findByCodigos.mock.calls[0][0]).toEqual(ALL_CODIGOS);
  });

  it("attaches the resolved disciplinaId and preserves normalized fields", async () => {
    const findByCodigos = vi.fn((codigos: string[]) =>
      Promise.resolve(codigos.map(codigo => ({ id: `id-${codigo}`, codigo })))
    );

    const preview = await buildImportPreview(ATESTADO_TEXT, findByCodigos);
    const compiladores = preview?.matched.find(m => m.codigo === "GDSCO0043");

    expect(compiladores).toMatchObject({
      codigo: "GDSCO0043",
      disciplinaId: "id-GDSCO0043",
      periodo: "2026.1",
      nome: "CONSTRUÇÃO DE COMPILADORES I",
      docente: "ANDREI DE ARAUJO FORMIGA",
      turma: "01",
      horario: "24T23",
      tipo: "disciplina",
      status: "matriculado",
    });

    // The split horário (7M1 + 35N34) is rejoined for LINGUA INGLESA I.
    const ingles = preview?.matched.find(m => m.codigo === "1404138");
    expect(ingles?.horario).toBe("7M1 35N34");

    // The atividade (no fixed schedule) has no horário.
    const uce = preview?.matched.find(m => m.codigo === "DINF00070");
    expect(uce?.tipo).toBe("atividade");
    expect(uce?.horario).toBeUndefined();
  });

  it("splits matched vs unknownCodigos when some códigos are not in the catalog", async () => {
    const knownCodigos = new Set(["GDSCO0043", "DINF00053", "1404138", "DSCO00022"]);
    const findByCodigos = vi.fn((codigos: string[]) =>
      Promise.resolve(
        codigos
          .filter(codigo => knownCodigos.has(codigo))
          .map(codigo => ({ id: `id-${codigo}`, codigo }))
      )
    );

    const preview = await buildImportPreview(ATESTADO_TEXT, findByCodigos);

    expect(preview?.matched.map(m => m.codigo)).toEqual([
      "GDSCO0043",
      "DINF00053",
      "1404138",
      "DSCO00022",
    ]);
    expect(preview?.unknownCodigos).toEqual(["DSCO00023", "GDLPL0063", "DINF00070"]);
    expect((preview?.matched.length ?? 0) + (preview?.unknownCodigos.length ?? 0)).toBe(7);
  });

  it("returns null for an unsupported document (detection finds no adapter)", async () => {
    const findByCodigos = vi.fn(() => Promise.resolve([]));
    const unsupportedText =
      "Comprovante de Pagamento\nValor: R$ 100,00\nData: 07/06/2026\nObrigado.";

    const preview = await buildImportPreview(unsupportedText, findByCodigos);

    expect(preview).toBeNull();
    expect(findByCodigos).not.toHaveBeenCalled();
  });
});
