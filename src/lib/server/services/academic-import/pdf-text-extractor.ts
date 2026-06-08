// Importing the library entry directly (not the package root) avoids pdf-parse's
// debug branch that reads a bundled sample PDF when the module is run as main.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Row reconstruction for SIGAA "Atestado de Matrícula" PDFs.
 *
 * pdf-parse's default `pagerender` only starts a new line when a text item's
 * y-coordinate differs *exactly* from the previous one. In practice the código,
 * the docente name and the horário columns of one logical row sit at slightly
 * different y-values (sub-pixel baseline jitter) and arrive in reading order that
 * is NOT left-to-right, so the default output detaches docentes from their códigos
 * and floats horários into the wrong block.
 *
 * The parser (Task 1) anchors on código rows and relies on each logical row being
 * coherent — like `pdftotext -layout`. To reproduce that we:
 *   1. group items into lines whose baseline y is within Y_TOLERANCE,
 *   2. sort lines top→bottom (PDF y grows upward, so descending y),
 *   3. sort items left→right within a line by x,
 *   4. join items with spacing derived from the horizontal gap so column
 *      separation survives (the parser uses ">= 2 spaces" to find column tails).
 */

type TextItem = {
  str: string;
  /** PDF.js transform matrix: [a, b, c, d, e, f] where e=x, f=y of the baseline. */
  transform: number[];
  width: number;
};

type TextContent = {
  items: TextItem[];
};

type PageData = {
  getTextContent: (options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }) => Promise<TextContent>;
};

/**
 * Baseline y values within this many PDF units are treated as the same visual
 * row. Atestado rows are comfortably farther apart than this, while the jitter
 * within a single row stays well below it.
 */
const Y_TOLERANCE = 3;

/**
 * Approximate width of one space character in PDF units for this document's
 * font. Horizontal gaps are converted to a proportional run of spaces so that
 * column boundaries (código | nome | turma | status | horário) remain visible
 * as multi-space gaps, which the parser depends on.
 */
const SPACE_WIDTH = 4;

/**
 * Gaps at or below this many PDF units are treated as "no gap" and produce zero
 * synthesized spaces. SIGAA renders titles and some names in small-caps, which
 * pdf.js emits as adjacent items split mid-word (e.g. "ARA"+"UJO") sitting
 * essentially flush (gap ~0). Forcing a minimum of one space there would corrupt
 * words and break header detection ("A TESTADO DE M ATRÍCULA"). Any space that is
 * genuinely needed between such items is already present in the item's own text.
 */
const NO_GAP_THRESHOLD = 2;

/** Cap on synthesized spaces so an extreme gap cannot explode the line length. */
const MAX_GAP_SPACES = 40;

function yOf(item: TextItem): number {
  return item.transform[5];
}

function xOf(item: TextItem): number {
  return item.transform[4];
}

type Line = {
  y: number;
  items: TextItem[];
};

function groupItemsIntoLines(items: TextItem[]): Line[] {
  const lines: Line[] = [];

  for (const item of items) {
    if (item.str.length === 0) {
      continue;
    }
    const y = yOf(item);
    const line = lines.find(candidate => Math.abs(candidate.y - y) <= Y_TOLERANCE);
    if (line) {
      line.items.push(item);
    } else {
      lines.push({ y, items: [item] });
    }
  }

  return lines;
}

/**
 * Renders a line as text, preserving each item's horizontal position as spaces.
 *
 * Leading indentation is reconstructed relative to `leftOrigin` (the page's left
 * text margin). The parser relies on this: it tells a nome continuation (which
 * sits shallowly in the código/período column) apart from a docente (which sits
 * in a column indented markedly further right) purely by leading indentation.
 * Left-trimming the lines would collapse that distinction and merge the nome
 * overflow into the docente field.
 */
function renderLine(items: TextItem[], leftOrigin: number): string {
  const sorted = [...items].sort((a, b) => xOf(a) - xOf(b));

  const firstX = xOf(sorted[0]);
  const leadingSpaces = Math.min(
    MAX_GAP_SPACES,
    Math.max(0, Math.round((firstX - leftOrigin) / SPACE_WIDTH))
  );
  let text = " ".repeat(leadingSpaces);
  let cursorX: number | null = null;

  for (const item of sorted) {
    const startX = xOf(item);
    if (cursorX !== null) {
      const gap = startX - cursorX;
      if (gap > NO_GAP_THRESHOLD) {
        const spaces = Math.min(MAX_GAP_SPACES, Math.round(gap / SPACE_WIDTH));
        text += " ".repeat(spaces);
      }
    }
    text += item.str;
    cursorX = startX + item.width;
  }

  return text;
}

function reconstructPage(pageData: PageData): Promise<string> {
  return pageData
    .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
    .then(content => {
      const lines = groupItemsIntoLines(content.items);
      // PDF y-axis points upward, so the visually top line has the largest y.
      lines.sort((a, b) => b.y - a.y);
      // The left text margin: the smallest starting x across all lines. Leading
      // indentation is measured from here so the código column maps to ~0 spaces.
      const leftOrigin = Math.min(...lines.map(line => Math.min(...line.items.map(xOf))));
      return lines.map(line => renderLine(line.items, leftOrigin)).join("\n");
    });
}

/**
 * Extracts row-coherent plain text from an Atestado de Matrícula PDF buffer,
 * suitable for the anchor-based parser.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer, { pagerender: reconstructPage });
  return result.text;
}
