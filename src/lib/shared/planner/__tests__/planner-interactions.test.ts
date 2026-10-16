/** @jest-environment node */
import { eraseAvailability, paintAvailability } from "../availability";
import { matchPublicCourse } from "../course-match";
import { draftSchema, emptyDraft, type PublicCourse } from "../types";
import { fitsAvailability } from "../solver";

const courses: PublicCourse[] = [
  { id: "1", name: "Ciência da Computação", campus: "João Pessoa", modality: "Presencial" },
  { id: "2", name: "Ciência da Computação", campus: "Rio Tinto", modality: "Presencial" },
];
test("identifies course and campus from SIGAA without choosing an ambiguous profile", () => {
  expect(
    matchPublicCourse(courses, "CIÊNCIA DA COMPUTAÇÃO (BACHARELADO) - João Pessoa - MT")?.id
  ).toBe("1");
  expect(matchPublicCourse(courses, null, "Ciência da Computação")).toBeNull();
  expect(matchPublicCourse(courses, "Outro curso", "Ciência da Computação")).toBeNull();
});
test("painting frees only the selected portion of a blocked interval", () => {
  const windows = paintAvailability([{ day: 1, start: 480, end: 660, kind: "busy" }], {
    day: 1,
    start: 540,
    end: 570,
    kind: "available",
  });
  expect(fitsAvailability({ day: 1, start: 540, end: 570 }, windows, "blocked")).toBe(true);
  expect(fitsAvailability({ day: 1, start: 570, end: 600 }, windows, "blocked")).toBe(false);
  expect(windows).toHaveLength(3);
});
test("drag painting merges contiguous cells and preserves precise boundaries", () => {
  const original = [{ day: 2, start: 485, end: 515, kind: "busy" as const }];
  const first = paintAvailability(original, { day: 1, start: 480, end: 510, kind: "unavailable" });
  const second = paintAvailability(first, { day: 1, start: 510, end: 540, kind: "unavailable" });
  expect(second).toContainEqual({ day: 1, start: 480, end: 540, kind: "unavailable" });
  expect(second).toContainEqual(original[0]);
  expect(original[0].end).toBe(515);
});
test("older scenarios get compatible priority and availability defaults", () => {
  const { priorityOrder: _order, ...draft } = emptyDraft("2026.2");
  const { respectAvailability: _respect, ...settings } = draft.settings;
  const parsed = draftSchema.parse({ ...draft, settings });
  expect(parsed.priorityOrder).toEqual([]);
  expect(parsed.settings.respectAvailability).toBe(true);
  expect(emptyDraft("2026.2").settings.minWorkload).toBe(180);
});

test("clearing a teaching period preserves impediments in other periods and days", () => {
  const windows = [
    { day: 1, start: 660, end: 840, kind: "busy" as const },
    { day: 2, start: 480, end: 600, kind: "busy" as const },
  ];
  expect(eraseAvailability(windows, { day: 1, start: 420, end: 780 })).toEqual([
    { day: 1, start: 780, end: 840, kind: "busy" },
    { day: 2, start: 480, end: 600, kind: "busy" },
  ]);
});
