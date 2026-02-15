import type { CategoriaEvento } from "@/lib/shared/types/calendario.types";

export const CATEGORIA_COLORS: Record<CategoriaEvento, string> = {
  MATRICULA_INGRESSANTES: "blue",
  MATRICULA_VETERANOS: "indigo",
  REMATRICULA: "violet",
  MATRICULA_EXTRAORDINARIA: "purple",
  PONTO_FACULTATIVO: "amber",
  FERIADO: "red",
  EXAMES_FINAIS: "orange",
  REGISTRO_MEDIAS_FINAIS: "yellow",
  COLACAO_DE_GRAU: "emerald",
  INICIO_PERIODO_LETIVO: "green",
  TERMINO_PERIODO_LETIVO: "rose",
  OUTRA: "slate",
};

export const CATEGORIA_LABELS: Record<CategoriaEvento, string> = {
  MATRICULA_INGRESSANTES: "Matrícula (Ingressantes)",
  MATRICULA_VETERANOS: "Matrícula (Veteranos)",
  REMATRICULA: "Rematrícula",
  MATRICULA_EXTRAORDINARIA: "Matrícula Extraordinária",
  PONTO_FACULTATIVO: "Ponto Facultativo",
  FERIADO: "Feriado",
  EXAMES_FINAIS: "Exames Finais",
  REGISTRO_MEDIAS_FINAIS: "Registro de Médias Finais",
  COLACAO_DE_GRAU: "Colação de Grau",
  INICIO_PERIODO_LETIVO: "Início do Período Letivo",
  TERMINO_PERIODO_LETIVO: "Término do Período Letivo",
  OUTRA: "Outra",
};

export const ALL_CATEGORIAS: CategoriaEvento[] = [
  "MATRICULA_INGRESSANTES",
  "MATRICULA_VETERANOS",
  "REMATRICULA",
  "MATRICULA_EXTRAORDINARIA",
  "PONTO_FACULTATIVO",
  "FERIADO",
  "EXAMES_FINAIS",
  "REGISTRO_MEDIAS_FINAIS",
  "COLACAO_DE_GRAU",
  "INICIO_PERIODO_LETIVO",
  "TERMINO_PERIODO_LETIVO",
  "OUTRA",
];

export function detectCategoria(eventText: string): CategoriaEvento {
  const text = eventText.toUpperCase();

  if (text.includes("INÍCIO DO PERÍODO LETIVO") || text.includes("INICIO DO PERIODO LETIVO")) {
    return "INICIO_PERIODO_LETIVO";
  }
  if (text.includes("TÉRMINO DO PERÍODO LETIVO") || text.includes("TERMINO DO PERIODO LETIVO")) {
    return "TERMINO_PERIODO_LETIVO";
  }
  if (text.includes("MATRÍCULA EXTRAORDINÁRIA") || text.includes("MATRICULA EXTRAORDINARIA")) {
    return "MATRICULA_EXTRAORDINARIA";
  }
  if (text.includes("REMATRÍCULA") || text.includes("REMATRICULA")) {
    return "REMATRICULA";
  }
  if ((text.includes("MATRÍCULA") || text.includes("MATRICULA")) && text.includes("INGRESSANTE")) {
    return "MATRICULA_INGRESSANTES";
  }
  if ((text.includes("MATRÍCULA") || text.includes("MATRICULA")) && text.includes("VETERANO")) {
    return "MATRICULA_VETERANOS";
  }
  if (text.includes("PONTO FACULTATIVO")) {
    return "PONTO_FACULTATIVO";
  }
  if (text.includes("FERIADO")) {
    return "FERIADO";
  }
  if (text.includes("EXAMES FINAIS")) {
    return "EXAMES_FINAIS";
  }
  if (text.includes("REGISTRO DE MÉDIAS FINAIS") || text.includes("MÉDIAS FINAIS")) {
    return "REGISTRO_MEDIAS_FINAIS";
  }
  if (text.includes("COLAÇÃO DE GRAU")) {
    return "COLACAO_DE_GRAU";
  }

  return "OUTRA";
}

export type CsvEventRow = {
  descricao: string;
  dataInicio: Date;
  dataFim: Date;
  categoria: CategoriaEvento;
};

export function parseCsvDate(dateStr: string): Date {
  // Remove any extra spaces
  const cleaned = dateStr.trim().replace(/\s+/g, "");
  const parts = cleaned.split("/");
  if (parts.length !== 3) {
    throw new Error(`Data inválida: ${dateStr}`);
  }
  const [day, month, year] = parts;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

export function parseCalendarioCsv(csvText: string): CsvEventRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return [];
  }

  const events: CsvEventRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const fields = parseCsvLine(line);

    if (fields.length < 3) {
      continue;
    }

    // Always use the last two fields as Start Date and End Date.
    // This handles both 3-column (Event, Start, End) and
    // 4-column (Event, Date, Start, End) CSV formats.
    const descricao = fields[0];
    const startDateStr = fields[fields.length - 2];
    const endDateStr = fields[fields.length - 1];

    if (!descricao || !startDateStr || !endDateStr) {
      continue;
    }

    try {
      const dataInicio = parseCsvDate(startDateStr);
      const dataFim = parseCsvDate(endDateStr);
      const categoria = detectCategoria(descricao);

      events.push({ descricao, dataInicio, dataFim, categoria });
    } catch {
      // Skip invalid rows
      continue;
    }
  }

  return events;
}

/**
 * Extract semester name and date range from parsed CSV events.
 * Uses INÍCIO DO PERÍODO LETIVO and TÉRMINO DO PERÍODO LETIVO events.
 */
export function extractSemestreInfo(events: CsvEventRow[]): {
  nome: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
} {
  let nome: string | null = null;
  let dataInicio: Date | null = null;
  let dataFim: Date | null = null;

  for (const event of events) {
    // Skip "PREVISÃO PARA INÍCIO..." which refers to the NEXT semester
    const isPrevisao = event.descricao.toUpperCase().includes("PREVISÃO");

    if (event.categoria === "INICIO_PERIODO_LETIVO" && !isPrevisao) {
      // Extract semester name from text like "INÍCIO DO PERÍODO LETIVO 2025.1"
      const match = event.descricao.match(/(\d{4}\.\d)/);
      if (match) {
        nome = match[1];
      }
      dataInicio = event.dataInicio;
    }
    if (event.categoria === "TERMINO_PERIODO_LETIVO" && !isPrevisao) {
      dataFim = event.dataInicio;
    }
  }

  return { nome, dataInicio, dataFim };
}
