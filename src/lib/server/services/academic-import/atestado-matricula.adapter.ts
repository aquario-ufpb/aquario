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
 * Marks the end of the component list; everything after is the schedule grid.
 * Anchored at line start (after optional indentation) so a docente/nome that
 * happens to contain the substring "Tabela de Horários:" cannot truncate parsing
 * early — only the standalone section label is treated as the cutoff.
 */
const SCHEDULE_TABLE_MARKER = /^[ \t]*tabela de hor[aá]rios:/im;

/**
 * Código-período anchor. Códigos in a SIGAA Atestado are either purely numeric
 * (e.g. 1404138) or letters-then-digits (e.g. GDSCO0043, DINF00053). Constraining
 * to that shape avoids over-matching arbitrary alphanumeric runs. Período is
 * YYYY.N. The hyphen separator may be followed by the período on the same line or
 * wrapped to the next line, so the período is captured separately when not inline.
 */
const CODIGO = "(?:[A-Z]{2,8}\\d{3,5}|\\d{6,8})";
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

/**
 * Document-level período used as a fallback for any block whose own período can't
 * be resolved. Returns the most frequent período across blocks that did resolve
 * (which is the document's enrollment período), or "" when none resolved.
 */
function inferDocumentPeriodo(body: string, anchors: AnchorMatch[]): string {
  const counts = new Map<string, number>();
  for (let i = 0; i < anchors.length; i++) {
    const blockStart = anchors[i].index;
    const blockEnd = i + 1 < anchors.length ? anchors[i + 1].index : body.length;
    const block = body.slice(blockStart, blockEnd);
    const periodo = resolveBlockPeriodo(block, anchors[i]);
    if (periodo) {
      counts.set(periodo, (counts.get(periodo) ?? 0) + 1);
    }
  }

  let best = "";
  let bestCount = 0;
  for (const [periodo, count] of counts) {
    if (count > bestCount) {
      best = periodo;
      bestCount = count;
    }
  }
  return best;
}

function resolveBlockPeriodo(block: string, anchor: AnchorMatch): string | undefined {
  // Período precedence: prefer the inline anchor período (numeric-código layout
  // where "1404138 - 2026.1" sits on one line); fall back to a período that
  // wrapped onto its own line within the block. This ordering is intentional —
  // the inline value is the most reliable when both are present.
  return anchor.inlinePeriodo ?? PERIODO_LINE_REGEX.exec(block)?.[1];
}

function parseBlock(
  block: string,
  anchor: AnchorMatch,
  fallbackPeriodo: string
): NormalizedDisciplina {
  const lines = block.split("\n");
  const firstLine = lines[0] ?? "";

  // Never drop a component just because its período could not be parsed from the
  // block: fall back to the document-level período (the most common período across
  // parsed blocks). If even that is unresolvable, keep "" rather than losing the row.
  const periodo = resolveBlockPeriodo(block, anchor) ?? fallbackPeriodo;

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

    // Require the real document title AND a SIGAA marker. Both are present in a
    // genuine Atestado de Matrícula. Relying on the title (rather than a structural
    // fingerprint of the enrollment/schedule tables) keeps detectAdapter routing
    // unambiguous — a Histórico Escolar shares those structural cues and must not
    // be claimed by this adapter.
    return (
      normalized.includes(ATESTADO_HEADER) &&
      SIGAA_MARKERS.some(marker => normalized.includes(marker))
    );
  },

  parse(text: string): NormalizedDisciplina[] {
    const scheduleMatch = SCHEDULE_TABLE_MARKER.exec(text);
    const body = scheduleMatch ? text.slice(0, scheduleMatch.index) : text;

    const anchors = findAnchors(body);

    // Document-level período fallback: the most common período across blocks whose
    // período resolved cleanly. Used to keep a block that lacks its own período.
    const documentPeriodo = inferDocumentPeriodo(body, anchors);

    const results: NormalizedDisciplina[] = [];

    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const blockStart = anchor.index;
      const blockEnd = i + 1 < anchors.length ? anchors[i + 1].index : body.length;
      const block = body.slice(blockStart, blockEnd);

      if (!STATUS_MATRICULADO.test(block)) {
        continue;
      }
      results.push(parseBlock(block, anchor, documentPeriodo));
    }

    return results;
  },
};
