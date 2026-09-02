import { describe, expect, it } from "vitest";
import {
  parseSigaaSnapshotCandidate,
  toSigaaAcademicSnapshotPayload,
  type SigaaSnapshotCandidate,
} from "@/lib/server/services/sigaa/storage.types";

const repeated = (character: string, length: number): string => character.repeat(length);
const numberedText = (prefix: string, index: number, length: number): string =>
  `${prefix}${index}`.padEnd(length, "x").slice(0, length);

const component = (index = 0) => ({
  code: numberedText("C", index, 64),
  name: repeated("n", 256),
  integrationType: repeated("i", 64),
  period: 100,
  workloadHours: 100_000,
  required: true,
  status: "completed" as const,
  prerequisite: repeated("p", 256),
  corequisite: repeated("c", 256),
  unrecognizedSource: { status: repeated("s", 64), period: repeated("r", 32) },
});

const grade = (index = 0) => ({
  semester: numberedText("S", index, 64),
  code: numberedText("G", index, 64),
  discipline: repeated("d", 256),
  units: Array.from({ length: 16 }, (_, unit) => numberedText("U", unit, 64)),
  exam: repeated("e", 64),
  result: repeated("r", 64),
  absences: repeated("a", 64),
  status: repeated("s", 64),
});

const currentClass = (index = 0) => ({
  sourceKey: numberedText("K", index, 64),
  name: repeated("n", 256),
  code: numberedText("D", index, 64),
  room: repeated("r", 256),
  scheduleRaw: repeated("s", 256),
  semester: repeated("m", 64),
});

const candidate = (): SigaaSnapshotCandidate =>
  parseSigaaSnapshotCandidate({
    contractVersion: "1.0",
    connectorObservedAt: new Date("2026-08-21T12:00:00Z"),
    connectorRequestId: repeated("q", 64),
    upstreamCommit: repeated("a", 40),
    identity: {
      matricula: "20260000001",
      sourceCourse: repeated("c", 256),
      sourceSemester: repeated("s", 64),
    },
    curriculum: {
      code: repeated("c", 64),
      maximumCompletionTerm: repeated("t", 64),
      semesterWorkload: { minimum: 100_000, maximum: 100_000 },
      cra: { value: "10.0000000000000", source: "academic_transcript" },
      progress: Array.from({ length: 64 }, () => ({
        description: repeated("p", 256),
        completedHours: 100_000,
        totalHours: 100_000,
        remainingHours: 0,
        completedPercent: 100,
      })),
      components: Array.from({ length: 2_048 }, (_, index) => component(index)),
    },
    grades: Array.from({ length: 256 }, (_, index) => grade(index)),
    classes: Array.from({ length: 64 }, (_, index) => currentClass(index)),
  });

describe("SIGAA storage contract", () => {
  it("accepts the transformed connector contract at every collection and field maximum", () => {
    const parsed = candidate();

    expect(parsed.curriculum.progress).toHaveLength(64);
    expect(parsed.curriculum.components).toHaveLength(2_048);
    expect(parsed.grades).toHaveLength(256);
    expect(parsed.classes).toHaveLength(64);
    expect(parsed.curriculum.progress[0].remainingHours).toBe(0);
    expect(toSigaaAcademicSnapshotPayload(parsed)).toEqual({
      identity: parsed.identity,
      curriculum: parsed.curriculum,
      grades: parsed.grades,
      classes: parsed.classes,
    });
  });

  it.each([
    [
      "progress",
      65,
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          progress: Array.from({ length: 65 }, () => value.curriculum.progress[0]),
        },
      }),
    ],
    [
      "components",
      2_049,
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          components: Array.from({ length: 2_049 }, (_, index) => component(index)),
        },
      }),
    ],
    [
      "grades",
      257,
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        grades: Array.from({ length: 257 }, (_, index) => grade(index)),
      }),
    ],
    [
      "classes",
      65,
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        classes: Array.from({ length: 65 }, (_, index) => currentClass(index)),
      }),
    ],
  ] as const)("rejects the first invalid %s collection size (%d)", (_field, _size, makeInvalid) => {
    expect(() => parseSigaaSnapshotCandidate(makeInvalid(candidate()))).toThrow();
  });

  it.each([
    [
      "completed hours greater than total",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          progress: [{ ...value.curriculum.progress[0], completedHours: 2, totalHours: 1 }],
        },
      }),
    ],
    [
      "remaining hours mismatch",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          progress: [{ ...value.curriculum.progress[0], remainingHours: 1 }],
        },
      }),
    ],
    [
      "semester workload range",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          semesterWorkload: { minimum: 2, maximum: 1 },
        },
      }),
    ],
    [
      "hour count 100001",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: { ...value.curriculum, semesterWorkload: { minimum: 100_001, maximum: null } },
      }),
    ],
    [
      "description length 257",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          progress: [{ ...value.curriculum.progress[0], description: repeated("p", 257) }],
        },
      }),
    ],
    [
      "integration type length 65",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          components: [{ ...value.curriculum.components[0], integrationType: repeated("i", 65) }],
        },
      }),
    ],
    [
      "grade units length 17",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        grades: [{ ...value.grades[0], units: Array.from({ length: 17 }, () => "U") }],
      }),
    ],
    [
      "period 101",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          components: [{ ...value.curriculum.components[0], period: 101 }],
        },
      }),
    ],
    [
      "invalid CRA",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: { ...value.curriculum, cra: { value: "10.1", source: "academic_transcript" } },
      }),
    ],
    [
      "duplicate normalized component code",
      (value: SigaaSnapshotCandidate) => ({
        ...value,
        curriculum: {
          ...value.curriculum,
          components: [value.curriculum.components[0], value.curriculum.components[0]],
        },
      }),
    ],
  ] as const)("rejects %s", (_name, makeInvalid) => {
    expect(() => parseSigaaSnapshotCandidate(makeInvalid(candidate()))).toThrow();
  });
});
