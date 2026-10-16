import { parseHorarioToSlots } from "../utils";
import { calendarScheduleKey } from "../room-binding";
import { meetingsFor } from "../../planner/solver";

it.each([
  ["DINF00078", "35M45", 4],
  ["DINF00070", "7M2345", 4],
  ["DINF00061", "7T2345", 4],
  ["DINF00060", "6M45", 2],
])(
  "preserves the real SIGAA timetable for %s with its validity suffix",
  (_code, schedule, count) => {
    const annotated = `${schedule} (28/08/2026 - 16/12/2026)`;
    expect(parseHorarioToSlots(annotated)).toHaveLength(count);
    expect(parseHorarioToSlots(annotated)).toEqual(parseHorarioToSlots(schedule));
    expect(meetingsFor(annotated)).toEqual(meetingsFor(schedule));
    expect(meetingsFor(annotated).length).toBeGreaterThan(0);
    expect(calendarScheduleKey(annotated)).toBe(calendarScheduleKey(schedule));
    expect(calendarScheduleKey(annotated)).not.toBe("");
  }
);

it("preserves multi-block schedules and trailing whitespace after a validity suffix", () => {
  const schedule = "5M1 24T23";
  expect(parseHorarioToSlots(`${schedule} (28/08/2026 - 16/12/2026)  `)).toEqual(
    parseHorarioToSlots(schedule)
  );
});

it.each([
  "35M45 (28/08/2026 - 16/12/2026",
  "35M45 (28/08/26 - 16/12/26)",
  "35M45 (28-08-2026 - 16-12-2026)",
  "35M45 (vigência desconhecida)",
  "35M45 (28/08/2026 - 16/12/2026) desconhecido",
  "35M45 desconhecido (28/08/2026 - 16/12/2026)",
  "35M45 (28/08/2026 - 16/12/2026) 2T12",
  "35M45 desconhecido",
  "35M45 8T12",
])(
  "still rejects the complete schedule when an annotation or token is unrecognized: %s",
  schedule => {
    expect(parseHorarioToSlots(schedule)).toEqual([]);
    expect(meetingsFor(schedule)).toEqual([]);
    expect(calendarScheduleKey(schedule)).toBe("");
  }
);
