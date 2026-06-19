import { getCopaTeam } from "./teams";
import type { CopaMatch, CopaStage } from "./types";

const BRASILIA_TZ = "America/Sao_Paulo";

export const STAGE_LABELS: Record<CopaStage, string> = {
  grupos: "Fase de grupos",
  "32avos": "Rodada de 32",
  oitavas: "Oitavas de final",
  quartas: "Quartas de final",
  semis: "Semifinais",
  terceiro: "Disputa de 3º lugar",
  final: "Final",
};

/** Rótulo curto para a etapa (usado em badges). */
export const STAGE_SHORT_LABELS: Record<CopaStage, string> = {
  grupos: "Grupos",
  "32avos": "32-avos",
  oitavas: "Oitavas",
  quartas: "Quartas",
  semis: "Semifinal",
  terceiro: "3º lugar",
  final: "Final",
};

/** Nome de exibição de um lado da partida (seleção ou placeholder). */
export function getMatchSideName(id: string | null, fallbackLabel: string | undefined): string {
  const team = getCopaTeam(id);
  if (team) {
    return team.nome;
  }
  return fallbackLabel ?? "A definir";
}

/** "Brasil x Marrocos" (ou placeholders no mata-mata). */
export function getMatchTitle(match: CopaMatch): string {
  const home = getMatchSideName(match.homeId, match.homeLabel);
  const away = getMatchSideName(match.awayId, match.awayLabel);
  return `${home} x ${away}`;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TZ,
  day: "2-digit",
  month: "long",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TZ,
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRASILIA_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

/** Chave de dia (YYYY-MM-DD no fuso de Brasília) para agrupar partidas. */
export function getDayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return parts;
}

export function formatKickoffTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatKickoffDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatKickoffWeekday(iso: string): string {
  const weekday = weekdayFormatter.format(new Date(iso));
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

/** "Sábado, 13 de junho · 19:00" */
export function formatKickoffFull(iso: string): string {
  return `${formatKickoffWeekday(iso)}, ${formatKickoffDate(iso)} · ${formatKickoffTime(iso)}`;
}

/** Duração padrão de uma partida para o evento de calendário (em minutos). */
const MATCH_DURATION_MINUTES = 120;

function toGoogleCalendarUTC(date: Date): string {
  return `${date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`;
}

/**
 * Gera a URL para adicionar uma partida ao Google Agenda.
 * Evento único (não recorrente), no horário correto convertido para UTC.
 */
export function buildMatchGoogleCalendarUrl(match: CopaMatch): string {
  const start = new Date(match.kickoff);
  const end = new Date(start.getTime() + MATCH_DURATION_MINUTES * 60 * 1000);

  const stageLabel = STAGE_LABELS[match.stage];
  const title = `⚽ Copa do Mundo: ${getMatchTitle(match)}`;

  const details = [
    `${stageLabel}${match.grupo ? ` · Grupo ${match.grupo}` : ""}`,
    `Local: ${match.venue} — ${match.city}`,
    `Horário de Brasília: ${formatKickoffTime(match.kickoff)}`,
    "",
    "Adicionado pelo Aquário · aquario.app",
  ].join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarUTC(start)}/${toGoogleCalendarUTC(end)}`,
    details,
    location: `${match.venue}, ${match.city}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Agrupa partidas por dia (Brasília), preservando a ordem cronológica. */
export function groupMatchesByDay<T extends CopaMatch>(
  matches: T[]
): Array<{
  dayKey: string;
  iso: string;
  matches: T[];
}> {
  const ordered = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  const groups = new Map<string, T[]>();
  for (const match of ordered) {
    const key = getDayKey(match.kickoff);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(match);
    } else {
      groups.set(key, [match]);
    }
  }

  return Array.from(groups.entries()).map(([dayKey, dayMatches]) => ({
    dayKey,
    iso: dayMatches[0].kickoff,
    matches: dayMatches,
  }));
}
