import type { AcademicImportPreview } from "@/lib/shared/types/academic-import.types";
import { atestadoMatriculaAdapter } from "./atestado-matricula.adapter";
import { detectAdapter } from "./detect-document";

/** Adapters tried, in order, when recognizing an uploaded academic document. */
export const ACADEMIC_DOCUMENT_ADAPTERS = [atestadoMatriculaAdapter];

/** Resolves a list of códigos to their Disciplina ids (catalog lookup). */
export type FindDisciplinasByCodigos = (
  codigos: string[]
) => Promise<{ id: string; codigo: string }[]>;

/**
 * Builds the non-persisted import preview from already-extracted document text.
 *
 * Detection is the caller's gate: when no adapter recognizes the text this
 * returns null so the route can map it to an UNSUPPORTED_DOCUMENT error. Keeping
 * the HTTP concerns out of here makes the detect→parse→resolve pipeline directly
 * testable from the committed pdf-parse fixture without PDF binaries or auth.
 */
export async function buildImportPreview(
  text: string,
  findByCodigos: FindDisciplinasByCodigos
): Promise<AcademicImportPreview | null> {
  const adapter = detectAdapter(text, ACADEMIC_DOCUMENT_ADAPTERS);
  if (!adapter) {
    return null;
  }

  const componentes = adapter.parse(text);
  const codigos = componentes.map(componente => componente.codigo);

  const found = await findByCodigos(codigos);
  const idByCodigo = new Map(found.map(row => [row.codigo, row.id]));

  const matched: AcademicImportPreview["matched"] = [];
  const unknownCodigos: string[] = [];

  for (const componente of componentes) {
    const disciplinaId = idByCodigo.get(componente.codigo);
    if (disciplinaId) {
      matched.push({ ...componente, disciplinaId });
    } else {
      unknownCodigos.push(componente.codigo);
    }
  }

  return { documento: adapter.id, matched, unknownCodigos };
}
