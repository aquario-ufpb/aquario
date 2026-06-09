import type { NormalizedDisciplina } from "@/lib/server/services/academic-import/document-adapter.interface";

/**
 * Shapes for the academic-import preview endpoint
 * (POST /api/usuarios/me/disciplinas/import).
 *
 * The endpoint parses an uploaded "Atestado de Matrícula" PDF and returns a
 * non-persisted preview: the user reviews it before any enrollment is saved.
 */

/** A parsed component whose código resolved to a Disciplina in the catalog. */
export type MatchedDisciplina = NormalizedDisciplina & {
  /** The resolved Disciplina id (UUID). */
  disciplinaId: string;
};

/** Preview returned by the import endpoint. Nothing is persisted. */
export type AcademicImportPreview = {
  /** Identifier of the adapter that recognized the document. */
  documento: string;
  /** Components whose código matched a known Disciplina, with its id attached. */
  matched: MatchedDisciplina[];
  /** Códigos parsed from the document that have no matching Disciplina row. */
  unknownCodigos: string[];
};
