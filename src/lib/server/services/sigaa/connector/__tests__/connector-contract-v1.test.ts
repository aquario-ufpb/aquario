/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

import fs from "node:fs";
import path from "node:path";

import { decodeSyncResponse, serializeSyncRequest } from "../connector-contract-v1";
import { SigaaConnectorError } from "../sigaa-connector.error";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "sync-response-v1.json");
const CONNECTOR_REQUEST_ID = "a".repeat(32);

function fixtureBody(): string {
  return fs.readFileSync(FIXTURE_PATH, "utf8");
}

function fixtureValue() {
  return JSON.parse(fixtureBody());
}

function expectInvalidResponse(value: unknown): void {
  try {
    decodeSyncResponse(JSON.stringify(value), CONNECTOR_REQUEST_ID);
    throw new Error("Expected response rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(SigaaConnectorError);
    expect((error as SigaaConnectorError).code).toBe("SIGAA_RESPONSE_INVALID");
  }
}

describe("SIGAA connector V1 contract", () => {
  it("maps the sanitized golden response into the domain candidate", () => {
    const candidate = decodeSyncResponse(fixtureBody(), CONNECTOR_REQUEST_ID);

    expect(candidate).toEqual({
      contractVersion: "1.0",
      connectorObservedAt: new Date("2026-08-21T12:00:00Z"),
      connectorRequestId: CONNECTOR_REQUEST_ID,
      upstreamCommit: "0123456789abcdef0123456789abcdef01234567",
      identity: {
        matricula: "20260000001",
        sourceCourse: "COMPUTACAO - GRADUACAO",
        sourceSemester: "2026.1",
      },
      curriculum: {
        code: "2026",
        maximumCompletionTerm: "2030.2",
        semesterWorkload: { minimum: 240, maximum: 480 },
        cra: { value: "8.42", source: "academic_transcript" },
        progress: [
          {
            description: "Obrigatoria",
            completedHours: 1200,
            totalHours: 2400,
            remainingHours: 1200,
            completedPercent: 50,
          },
        ],
        components: [
          {
            code: "DCC101",
            name: "Programacao",
            integrationType: "OB",
            period: 1,
            workloadHours: 60,
            required: true,
            status: "completed",
            prerequisite: null,
            corequisite: null,
          },
          {
            code: "DCC102",
            name: "Estruturas de Dados",
            integrationType: "OB",
            period: 2,
            workloadHours: 60,
            required: true,
            status: "enrolled",
            prerequisite: "DCC101",
            corequisite: null,
          },
          {
            code: "DCC103",
            name: "Redes",
            integrationType: "OB",
            period: 3,
            workloadHours: 60,
            required: true,
            status: "pending",
            prerequisite: null,
            corequisite: null,
          },
          {
            code: "OPT001",
            name: "Topicos Especiais",
            integrationType: "OP",
            period: null,
            workloadHours: 60,
            required: false,
            status: "unknown",
            prerequisite: null,
            corequisite: null,
            unrecognizedSource: {
              status: "NAO CLASSIFICADO",
              period: "SEM NIVEL",
            },
          },
        ],
      },
      grades: [
        {
          semester: "2026.1",
          code: "DCC102",
          discipline: "Estruturas de Dados",
          units: ["8.0", "9.0"],
          exam: null,
          result: "8.5",
          absences: "0",
          status: "MATRICULADO",
        },
      ],
      classes: [
        {
          sourceKey: "123",
          name: "Estruturas de Dados",
          code: "DCC102",
          room: "CI 101",
          scheduleRaw: "246M12",
          semester: "2026.1",
        },
      ],
    });
    expect(candidate).not.toHaveProperty("student.name");
    expect(candidate).not.toHaveProperty("student.email");
    expect(candidate.curriculum).not.toHaveProperty("counts");
  });

  it("keeps the fixture literal and sanitized instead of replacing placeholders at runtime", () => {
    const fixture = fixtureValue();

    expect(fixture.source.upstream_repository).toBe("https://github.com/PucaVaz/sigaa-tools.git");
    expect(fixture.source.adapter).toBe("sigaa-tools");
    expect(fixture.source.upstream_commit).toBe("0123456789abcdef0123456789abcdef01234567");
    expect(fixture.student.name).toBe("Pessoa de Teste");
    expect(fixture.student.email).toBe("pessoa@example.test");
    expect(fixtureBody()).not.toContain("__UPSTREAM_");
  });

  it("accepts a null source course without weakening the candidate", () => {
    const fixture = fixtureValue();
    fixture.student.course = null;

    expect(
      decodeSyncResponse(JSON.stringify(fixture), CONNECTOR_REQUEST_ID).identity.sourceCourse
    ).toBeNull();
  });

  it("normalizes component, grade, and class codes with NFKC, case, and whitespace", () => {
    const fixture = fixtureValue();
    fixture.curriculum.components[0].code = "  ｄｃｃ１０１  ";
    fixture.grades[0].code = " dcc102 ";
    fixture.classes[0].code = " dcc102 ";

    const candidate = decodeSyncResponse(JSON.stringify(fixture), CONNECTOR_REQUEST_ID);

    expect(candidate.curriculum.components[0].code).toBe("DCC101");
    expect(candidate.grades[0].code).toBe("DCC102");
    expect(candidate.classes[0].code).toBe("DCC102");
  });

  it("rejects duplicate normalized component codes", () => {
    const fixture = fixtureValue();
    fixture.curriculum.components[1].code = " dcc101 ";

    expectInvalidResponse(fixture);
  });

  it.each([
    ["top-level extra field", (value: ReturnType<typeof fixtureValue>) => (value.extra = true)],
    [
      "nested extra field",
      (value: ReturnType<typeof fixtureValue>) => (value.curriculum.cra.extra = true),
    ],
    [
      "bounded string",
      (value: ReturnType<typeof fixtureValue>) =>
        (value.curriculum.progress[0].description = "x".repeat(257)),
    ],
    [
      "bounded list",
      (value: ReturnType<typeof fixtureValue>) =>
        (value.grades[0].units = Array.from({ length: 17 }, () => "1")),
    ],
    [
      "derived counts",
      (value: ReturnType<typeof fixtureValue>) => (value.curriculum.counts.total = 3),
    ],
    [
      "derived workload",
      (value: ReturnType<typeof fixtureValue>) =>
        (value.curriculum.progress[0].remaining_hours = 1199),
    ],
    [
      "semester workload range",
      (value: ReturnType<typeof fixtureValue>) =>
        (value.curriculum.semester_workload_hours.minimum = 481),
    ],
  ])("rejects %s", (_caseName, mutate) => {
    const fixture = fixtureValue();
    mutate(fixture);
    expectInvalidResponse(fixture);
  });

  it("serializes the nullable expected_matricula field in snake_case", () => {
    expect(
      JSON.parse(
        serializeSyncRequest({
          username: " 20260000001 ",
          password: "private-password",
          expectedMatricula: null,
        })
      )
    ).toEqual({
      username: "20260000001",
      password: "private-password",
      expected_matricula: null,
    });
  });

  it.each(["", "2026", "2026000000x", "202600000012"])(
    "rejects invalid expected_matricula %p",
    expectedMatricula => {
      expect(() =>
        serializeSyncRequest({
          username: "20260000001",
          password: "private-password",
          expectedMatricula,
        })
      ).toThrow("Invalid SIGAA connector request");
    }
  );
});
