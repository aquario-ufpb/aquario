import { nextPlanningSemester } from "../semester";

it.each([
  ["2026.1", "2026.2"],
  ["2026.2", "2027.1"],
])("plans the term after the valid source %s", (source, expected) =>
  expect(nextPlanningSemester(source, new Date(2030, 9, 15))).toBe(expected)
);
it.each([undefined, null, "invalid"])(
  "plans next year's first term in October without a usable source %p",
  source => {
    expect(nextPlanningSemester(source, new Date(2026, 9, 15))).toBe("2027.1");
  }
);
