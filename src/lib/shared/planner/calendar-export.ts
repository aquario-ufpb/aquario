import type { PlannerOffer } from "./types";
import { meetingsFor } from "./solver";

export const PLANNER_TIME_ZONE = "America/Recife";
const isoDay = /^\d{4}-\d{2}-\d{2}$/;
const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function dateValue(value: string): Date {
  if (!isoDay.test(value)) {
    throw new Error("Informe as datas de início e fim das aulas.");
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Data inválida.");
  }
  return date;
}
/** Interpret institutional wall time independently of the browser's configured timezone. */
export function recifeInstant(day: string, minutes: number): Date {
  const date = dateValue(day);
  date.setUTCMinutes(minutes);
  const target = date.getTime();
  let instant = target;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PLANNER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(instant)).map(part => [part.type, part.value])
    );
    const actual = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    instant += target - actual;
  }
  return new Date(instant);
}
const escapeICS = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
function fold(line: string): string {
  const encoder = new TextEncoder();
  let current = "",
    size = 0;
  const lines: string[] = [];
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > 73) {
      lines.push(current);
      current = " ";
      size = 1;
    }
    current += char;
    size += bytes;
  }
  lines.push(current);
  return lines.join("\r\n");
}
function hash(text: string): string {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16);
}
export type CalendarSeries = {
  offer: PlannerOffer;
  start: Date;
  end: Date;
  until: Date;
  day: number;
  uid: string;
  googleUrl: string;
};
export function plannerCalendarSeries(
  offers: PlannerOffer[],
  startDay: string,
  endDay: string
): CalendarSeries[] {
  const start = dateValue(startDay),
    end = dateValue(endDay);
  if (start > end) {
    throw new Error("O fim das aulas deve ser igual ou posterior ao início.");
  }
  const until = recifeInstant(endDay, 1439);
  until.setUTCSeconds(59);
  const series: CalendarSeries[] = [];
  for (const offer of offers) {
    const meetings = meetingsFor(offer.schedule);
    if (!meetings.length) {
      throw new Error(`Horário não reconhecido: ${offer.code}.`);
    }
    meetings.forEach((meeting, index) => {
      const first = new Date(start);
      const weekday = meeting.day % 7;
      first.setUTCDate(first.getUTCDate() + ((weekday - first.getUTCDay() + 7) % 7));
      if (first > end) {
        return;
      }
      const date = first.toISOString().slice(0, 10);
      const eventStart = recifeInstant(date, meeting.start),
        eventEnd = recifeInstant(date, meeting.end);
      const uid = `${hash(`${offer.semester}:${offer.id}:${meeting.day}:${index}`)}@planner.aquario`;
      const recurrence = `RRULE:FREQ=WEEKLY;BYDAY=${["SU", "MO", "TU", "WE", "TH", "FR", "SA"][weekday]};UNTIL=${stamp(until)}`;
      const description = `${offer.code} · Turma ${offer.section}\n${offer.teacher}\nPlanejamento de matrícula; confira a matrícula e o local no SIGAA.`;
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: offer.name,
        dates: `${stamp(eventStart)}/${stamp(eventEnd)}`,
        ctz: PLANNER_TIME_ZONE,
        details: description,
        location: offer.location ?? "Local a confirmar",
        recur: recurrence,
      });
      series.push({
        offer,
        start: eventStart,
        end: eventEnd,
        until,
        day: weekday,
        uid,
        googleUrl: `https://calendar.google.com/calendar/render?${params}`,
      });
    });
  }
  if (!series.length) {
    throw new Error("Nenhuma aula ocorre no intervalo de datas escolhido.");
  }
  return series;
}
export function generatePlannerICS(
  offers: PlannerOffer[],
  startDay: string,
  endDay: string
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aquario//Planejador de Matricula//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-TIMEZONE:${PLANNER_TIME_ZONE}`,
  ];
  for (const series of plannerCalendarSeries(offers, startDay, endDay)) {
    const { offer } = series;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${series.uid}`,
      `DTSTAMP:${stamp(new Date())}`,
      `SEQUENCE:${Math.min(2147483647, Math.max(0, Math.floor(Date.parse(offer.observedAt) / 1000)))}`,
      `DTSTART:${stamp(series.start)}`,
      `DTEND:${stamp(series.end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${["SU", "MO", "TU", "WE", "TH", "FR", "SA"][series.day]};UNTIL=${stamp(series.until)}`,
      `SUMMARY:${escapeICS(offer.name)}`,
      `LOCATION:${escapeICS(offer.location ?? "Local a confirmar")}`,
      `DESCRIPTION:${escapeICS(`${offer.code} · Turma ${offer.section}\n${offer.teacher}\nPlanejamento; matrícula não confirmada pelo Aquário.`)}`,
      "STATUS:TENTATIVE",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
