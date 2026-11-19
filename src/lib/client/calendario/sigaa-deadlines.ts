import type { DateArray, EventAttributes } from "ics";

const DAY = 86_400_000;
const FORTALEZA_OFFSET_HOURS = 3;
const datePattern =
  /^(?:(seg|ter|qua|qui|sex|sáb|dom)\.?,?\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?:\s+(?:(?:às|das)\s+)?(\d{1,2}):(\d{2}))?$/iu;

type Endpoint = { year?: number; month: number; day: number; weekday?: string; minutes?: number };
const weekdays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
type CalendarPeriod = { start: DateArray; end?: DateArray };

function parseEndpoint(raw: string): Endpoint | null {
  const match = datePattern.exec(raw);
  if (!match) {
    return null;
  }
  const [, weekday, day, month, year, hour, minute] = match;
  if (Number(hour) > 23 || Number(minute) > 59) {
    return null;
  }
  return {
    day: Number(day),
    month: Number(month),
    year: year ? Number(year) : undefined,
    weekday: weekday?.toLowerCase(),
    minutes: hour === undefined ? undefined : Number(hour) * 60 + Number(minute),
  };
}

function calendarDay(endpoint: Endpoint, year: number): number | null {
  const value = new Date(Date.UTC(year, endpoint.month - 1, endpoint.day));
  return value.getUTCFullYear() === year &&
    value.getUTCMonth() + 1 === endpoint.month &&
    value.getUTCDate() === endpoint.day &&
    (!endpoint.weekday || weekdays[value.getUTCDay()] === endpoint.weekday)
    ? value.getTime()
    : null;
}

function dateArray(day: number, minutes?: number): DateArray {
  const date = new Date(
    day + (minutes === undefined ? 0 : (minutes + FORTALEZA_OFFSET_HOURS * 60) * 60_000)
  );
  const result: [number, number, number] = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  ];
  return minutes !== undefined ? [...result, date.getUTCHours(), date.getUTCMinutes()] : result;
}

// Portal cards often omit the year. Anchor those dates to the observation in João Pessoa,
// including cards still visible just after New Year and upcoming cards in December.
export function parseDeadlinePeriod(raw: string, observedAt: string): CalendarPeriod | null {
  const localObserved = new Date(Date.parse(observedAt) - FORTALEZA_OFFSET_HOURS * 3_600_000);
  if (!Number.isFinite(localObserved.getTime())) {
    return null;
  }

  const input = raw.trim();
  const single = parseEndpoint(input);
  let start = single;
  let finish = single;
  if (!single) {
    const sameDayTimes = /^(.*\d:\d{2})\s+às\s+(\d{1,2}:\d{2})$/iu.exec(input);
    const parts = sameDayTimes ? sameDayTimes.slice(1) : input.split(/\s+(?:a|à|até|[-–])\s+/iu);
    if (parts.length !== 2) {
      return null;
    }
    start = parseEndpoint(parts[0]);
    finish = parseEndpoint(parts[1]);
    if (start?.minutes !== undefined && !finish && /^\d{1,2}:\d{2}$/.test(parts[1])) {
      const timed = parseEndpoint(`${start.day}/${start.month} ${parts[1]}`);
      if (timed) {
        finish = { ...start, minutes: timed.minutes };
      }
    }
  }
  if (!start || !finish || (start.minutes === undefined) !== (finish.minutes === undefined)) {
    return null;
  }

  const crossesYear = finish.month < start.month;
  const referenceYear = localObserved.getUTCFullYear();
  const explicitYear =
    start.year ?? (finish.year === undefined ? undefined : finish.year - Number(crossesYear));
  const referenceDay = Date.UTC(
    referenceYear,
    localObserved.getUTCMonth(),
    localObserved.getUTCDate()
  );
  const years =
    explicitYear === undefined
      ? [referenceYear - 1, referenceYear, referenceYear + 1]
      : [explicitYear];
  let best: { distance: number; period: CalendarPeriod } | undefined;
  for (const year of years) {
    const startDay = calendarDay(start, year);
    const endDay = calendarDay(finish, finish.year ?? year + Number(crossesYear));
    if (startDay === null || endDay === null || endDay < startDay) {
      continue;
    }
    const distance = Math.max(startDay - referenceDay, referenceDay - endDay, 0);
    if (explicitYear === undefined && distance > 183 * DAY) {
      continue;
    }
    if (best && best.distance <= distance) {
      continue;
    }
    if (startDay === endDay && (finish.minutes ?? 0) < (start.minutes ?? 0)) {
      continue;
    }
    const startDate = dateArray(startDay, start.minutes);
    const endDate =
      finish.minutes === undefined ? dateArray(endDay + DAY) : dateArray(endDay, finish.minutes);
    const period =
      calendarToken(startDate) === calendarToken(endDate)
        ? { start: startDate }
        : { start: startDate, end: endDate };
    best = { distance, period };
  }
  return best?.period ?? null;
}

function calendarToken(value: DateArray): string {
  const [y, m, d, h, min] = value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}${pad(m)}${pad(d)}${h === undefined ? "" : `T${pad(h)}${pad(min ?? 0)}00Z`}`;
}

export function googleDeadlineUrl(title: string, period: CalendarPeriod): string {
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calendarToken(period.start)}/${calendarToken(period.end ?? period.start)}`,
  });
  return `https://calendar.google.com/calendar/render?${query}`;
}

export async function downloadDeadlineCalendar(
  events: (CalendarPeriod & Pick<EventAttributes, "uid" | "title">)[]
): Promise<void> {
  const [{ createEvents }, { downloadICSFile }] = await Promise.all([
    import("ics"),
    import("./ics"),
  ]);
  // The encoder accepts a start alone for an instant (RFC 5545); its types require an end.
  const { value, error } = createEvents(
    events.map(event => ({
      ...event,
      startInputType: "utc",
      endInputType: "utc",
    })) as EventAttributes[]
  );
  if (error || !value) {
    throw new Error("Não foi possível gerar o calendário.");
  }
  downloadICSFile(
    new Blob([value], { type: "text/calendar;charset=utf-8" }),
    "provas-e-atividades.ics"
  );
}
