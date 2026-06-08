import type {
  AcademicDocumentAdapter,
  DisciplinaTipo,
  NormalizedDisciplina,
} from "./document-adapter.interface";

const ADAPTER_ID = "atestado-matricula";

/** Detection markers (accent/case tolerant via normalization). */
const ATESTADO_HEADER = "atestado de matricula";
const SIGAA_MARKERS = ["sistema integrado de gestao", "sigaa", "portal do discente"];

/**
 * Structural fingerprint of a SIGAA Atestado de Matrícula. The sanitized fixture
 * (and any PDF whose institutional header was cropped) may lack the explicit
 * "Atestado de Matrícula" title, so detection also accepts the unmistakable
 * combination of the enrollment table headings + status + schedule table.
 */
const STRUCTURAL_MARKERS = ["componentes curriculares", "matriculado", "tabela de horarios:"];

/** Marks the end of the component list; everything after is the schedule grid. */
const SCHEDULE_TABLE_MARKER = /tabela de hor[aá]rios:/i;

/**
 * Código-período anchor. Códigos may be alphanumeric (GDSCO0043, DINF00053) or
 * purely numeric (1404138). Período is YYYY.N. The hyphen separator may be
 * followed by the período on the same line or wrapped to the next line, so the
 * período is captured separately when not inline.
 */
const CODIGO = "[A-Z0-9]{4,9}";
const PERIODO = "\\d{4}\\.\\d";
// Anchored at the start of a row (leading whitespace only) so that hyphenated
// words mid-line (e.g. "CIENTÍFICA-TECNOLÓGICA") are not mistaken for códigos.
// Optionally captures an inline período "2026.1" (the numeric-código layout).
const ANCHOR_REGEX = new RegExp(`^[ \\t]*(${CODIGO})\\s*-\\s*(${PERIODO})?`, "gm");
// Período that wrapped onto its own (or a later) line within the block.
const PERIODO_LINE_REGEX = new RegExp(`(${PERIODO})`);

/** Enrollment status token. Only MATRICULADO appears in an Atestado. */
const STATUS_MATRICULADO = /\bMATRICULADO\b/;

/** Turma is the "01"-style two-digit class number. */
const TURMA_REGEX = /\b(\d{2})\b/;

/**
 * Horário token, e.g. 24T23, 6M2345, 3T1234, 35N34. Day digits (1-7) followed
 * by a shift letter (M/T/N) followed by slot digits.
 */
const HORARIO_REGEX = /\b(\d{1,3}[MTN]\d{1,4})\b/g;
// Note: a "--" placeholder (activity with no fixed schedule) simply yields no
// horário token and is therefore reported as undefined.

/** Tipo line, e.g. "Tipo: DISCIPLINA  Local: À DEFINIR (CI)". */
const TIPO_REGEX = /Tipo:\s*(DISCIPLINA|ATIVIDADE)/i;
/** Marks the trailing metadata of a component (docente comes before it). */
const TIPO_OR_LOCAL_REGEX = /\b(Tipo:|Local:)/i;

/** Unicode combining diacritical marks range (U+0300–U+036F). */
const COMBINING_MARKS_REGEX = /[̀-ͯ]/g;

function normalizeForMatch(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS_REGEX, "").toLowerCase();
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

type AnchorMatch = {
  index: number;
  codigo: string;
  inlinePeriodo: string | undefined;
};

function findAnchors(text: string): AnchorMatch[] {
  const anchors: AnchorMatch[] = [];
  ANCHOR_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANCHOR_REGEX.exec(text)) !== null) {
    anchors.push({
      index: match.index,
      codigo: match[1],
      inlinePeriodo: match[2],
    });
  }
  return anchors;
}

/**
 * The first line of a block holds: the código-período prefix, the start of the
 * nome, and (usually) the turma / status / horário columns. This strips those
 * trailing columns so only the nome fragment remains.
 */
function extractNomeFragment(firstLine: string, codigo: string): string {
  // Drop everything up to and including the código-período prefix.
  const afterPrefix = firstLine
    .replace(new RegExp(`^.*?${codigo}\\s*-\\s*(?:${PERIODO})?`), "")
    .trimStart();
  // Cut at the turma/status/horário tail when present.
  const tailStart = afterPrefix.search(/\s{2,}\d{2}\s+MATRICULADO/);
  const beforeTail = tailStart >= 0 ? afterPrefix.slice(0, tailStart) : afterPrefix;
  return collapseWhitespace(beforeTail);
}

function extractHorarioTokens(line: string): string[] {
  const tokens: string[] = [];
  HORARIO_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HORARIO_REGEX.exec(line)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

/** Indentation (leading spaces) of a line, or -1 when blank. */
function indentOf(line: string): number {
  const firstNonSpace = line.search(/\S/);
  return firstNonSpace;
}

/**
 * The docente column sits markedly further right than the código/período column.
 * A line whose text begins at least this many spaces deeper than the código
 * column belongs to the docente column rather than to the nome continuation.
 */
const DOCENTE_COLUMN_INDENT_DELTA = 12;

function parseBlock(block: string, anchor: AnchorMatch): NormalizedDisciplina | null {
  const lines = block.split("\n");
  const firstLine = lines[0] ?? "";

  const periodo = anchor.inlinePeriodo ?? PERIODO_LINE_REGEX.exec(block)?.[1] ?? "";
  if (!periodo) {
    return null;
  }

  const tipoMatch = TIPO_REGEX.exec(block);
  const tipo: DisciplinaTipo =
    tipoMatch?.[1]?.toUpperCase() === "ATIVIDADE" ? "atividade" : "disciplina";

  const turma = TURMA_REGEX.exec(firstLine)?.[1];

  const codigoColumnIndent = indentOf(firstLine);
  const docenteColumnThreshold = codigoColumnIndent + DOCENTE_COLUMN_INDENT_DELTA;

  const horarioTokens: string[] = [...extractHorarioTokens(firstLine)];
  const nomeParts: string[] = [extractNomeFragment(firstLine, anchor.codigo)];
  // Continuation text living in the código/período column (indented shallowly):
  // it is a nome overflow when a separate docente column exists, otherwise it is
  // the docente line itself (short titles leave the período line for the docente).
  const shallowContinuations: string[] = [];
  const docenteColumnLines: string[] = [];

  let reachedTipo = false;
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    if (raw.trim().length === 0) {
      continue;
    }

    if (TIPO_OR_LOCAL_REGEX.test(raw)) {
      reachedTipo = true;
      continue;
    }
    if (reachedTipo) {
      continue;
    }

    const indent = indentOf(raw);
    // Strip the período token and any horário column token (the latter may float
    // to the right of docente text, e.g. the second half "35N34").
    const withoutPeriodo = raw.replace(PERIODO_LINE_REGEX, "");
    horarioTokens.push(...extractHorarioTokens(withoutPeriodo));
    const remainder = collapseWhitespace(withoutPeriodo.replace(HORARIO_REGEX, ""));
    if (remainder.length === 0) {
      continue;
    }

    if (indent >= docenteColumnThreshold) {
      docenteColumnLines.push(remainder);
    } else {
      shallowContinuations.push(remainder);
    }
  }

  // A shallow continuation is a nome overflow when the docente sits in its own
  // column; with no such column the shallow continuation IS the docente.
  if (docenteColumnLines.length > 0) {
    nomeParts.push(...shallowContinuations);
  } else {
    docenteColumnLines.push(...shallowContinuations);
  }

  const horario = horarioTokens.length > 0 ? horarioTokens.join(" ") : undefined;

  return {
    codigo: anchor.codigo,
    periodo,
    nome: collapseWhitespace(nomeParts.join(" ")),
    docente:
      docenteColumnLines.length > 0 ? collapseWhitespace(docenteColumnLines.join(" ")) : undefined,
    turma,
    horario,
    tipo,
    status: "matriculado",
  };
}

export const atestadoMatriculaAdapter: AcademicDocumentAdapter = {
  id: ADAPTER_ID,

  matches(text: string): boolean {
    const normalized = normalizeForMatch(text);

    const hasExplicitHeader =
      normalized.includes(ATESTADO_HEADER) &&
      SIGAA_MARKERS.some(marker => normalized.includes(marker));
    if (hasExplicitHeader) {
      return true;
    }

    return STRUCTURAL_MARKERS.every(marker => normalized.includes(marker));
  },

  parse(text: string): NormalizedDisciplina[] {
    const scheduleMatch = SCHEDULE_TABLE_MARKER.exec(text);
    const body = scheduleMatch ? text.slice(0, scheduleMatch.index) : text;

    const anchors = findAnchors(body);
    const results: NormalizedDisciplina[] = [];

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const blockStart = anchor.index;
      const blockEnd = i + 1 < anchors.length ? anchors[i + 1].index : body.length;
      const block = body.slice(blockStart, blockEnd);

      const parsed = parseBlock(block, anchor);
      if (parsed && STATUS_MATRICULADO.test(block)) {
        results.push(parsed);
      }
    }

    return results;
  },
};
