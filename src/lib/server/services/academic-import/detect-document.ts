import type { AcademicDocumentAdapter } from "./document-adapter.interface";

/**
 * Returns the first adapter that recognizes the given document text, or null
 * when no registered adapter matches.
 */
export function detectAdapter(
  text: string,
  adapters: AcademicDocumentAdapter[]
): AcademicDocumentAdapter | null {
  return adapters.find(adapter => adapter.matches(text)) ?? null;
}
