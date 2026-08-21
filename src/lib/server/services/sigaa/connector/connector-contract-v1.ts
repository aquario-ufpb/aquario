import "server-only";

import { z } from "zod";

import type {
  SigaaAcademicComponent,
  SigaaClass,
  SigaaGrade,
  SigaaSnapshotCandidate,
} from "./sigaa-connector.port";
import { SigaaConnectorError, type SigaaConnectorFailureCode } from "./sigaa-connector.error";

const UPSTREAM_REPOSITORY = "https://github.com/PucaVaz/sigaa-for-ai-agents.git";

const usernameSchema = z
  .string()
  .min(1)
  .max(64)
  .transform(value => value.trim())
  .refine(value => value.length > 0);
const passwordSchema = z.string().min(1).max(256);
const matriculaSchema = z.string().regex(/^\d{11}$/);
const shortTextSchema = z.string().min(1).max(64);
const mediumTextSchema = z.string().min(1).max(256);
const nullableShortTextSchema = shortTextSchema.nullable();
const nullableMediumTextSchema = mediumTextSchema.nullable();
const hourCountSchema = z.number().int().min(0).max(100_000);
const componentCountSchema = z.number().int().min(0).max(2_048);
const percentSchema = z.number().min(0).max(100);

const credentialsSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

const syncRequestSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    expected_matricula: matriculaSchema.nullable(),
  })
  .strict();

const sourceSchema = z
  .object({
    system: z.literal("SIGAA_UFPB"),
    adapter: z.literal("sigaa-for-ai-agents"),
    upstream_repository: z.literal(UPSTREAM_REPOSITORY),
    upstream_commit: z.string().regex(/^[0-9a-f]{40}$/),
  })
  .strict();

const studentSchema = z
  .object({
    matricula: matriculaSchema,
    name: mediumTextSchema,
    course: nullableMediumTextSchema,
    email: z.string().min(3).max(320).nullable(),
    semester: nullableShortTextSchema,
  })
  .strict();

const craSchema = z
  .object({
    value: z
      .string()
      .min(1)
      .max(16)
      .regex(/^(?:10(?:\.0+)?|[0-9](?:\.\d+)?)$/)
      .nullable(),
    source: z.enum(["academic_transcript", "unavailable"]),
  })
  .strict();

const semesterWorkloadSchema = z
  .object({
    minimum: hourCountSchema.nullable(),
    maximum: hourCountSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.minimum !== null && value.maximum !== null && value.minimum > value.maximum) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minimum semester workload exceeds maximum",
        path: ["minimum"],
      });
    }
  });

const workloadProgressSchema = z
  .object({
    description: mediumTextSchema,
    completed_hours: hourCountSchema,
    total_hours: hourCountSchema,
    remaining_hours: hourCountSchema,
    completed_percent: percentSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.completed_hours > value.total_hours) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "completed hours exceed total hours",
        path: ["completed_hours"],
      });
    }
    if (value.remaining_hours !== value.total_hours - value.completed_hours) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "remaining hours do not match total and completed hours",
        path: ["remaining_hours"],
      });
    }
  });

const componentStatusSchema = z.enum(["completed", "enrolled", "pending", "unknown"]);

const curriculumComponentSchema = z
  .object({
    code: shortTextSchema,
    name: mediumTextSchema,
    integration_type: shortTextSchema,
    period: z.number().int().min(0).max(100).nullable(),
    period_raw: z.union([z.string().min(1).max(32), z.number(), z.null()]),
    workload_hours: hourCountSchema,
    required: z.boolean(),
    status: componentStatusSchema,
    status_raw: nullableShortTextSchema,
    prerequisite: nullableMediumTextSchema,
    corequisite: nullableMediumTextSchema,
  })
  .strict();

const curriculumCountsSchema = z
  .object({
    total: componentCountSchema,
    completed: componentCountSchema,
    enrolled: componentCountSchema,
    pending: componentCountSchema,
    unknown: componentCountSchema,
    pending_required: componentCountSchema,
    pending_optional: componentCountSchema,
  })
  .strict();

const curriculumSchema = z
  .object({
    curriculum: shortTextSchema,
    maximum_completion_term: nullableShortTextSchema,
    semester_workload_hours: semesterWorkloadSchema,
    cra: craSchema,
    progress: z.array(workloadProgressSchema).max(64),
    counts: curriculumCountsSchema,
    components: z.array(curriculumComponentSchema).max(2_048),
  })
  .strict()
  .superRefine((value, context) => {
    const expected = {
      total: value.components.length,
      completed: value.components.filter(item => item.status === "completed").length,
      enrolled: value.components.filter(item => item.status === "enrolled").length,
      pending: value.components.filter(item => item.status === "pending").length,
      unknown: value.components.filter(item => item.status === "unknown").length,
      pending_required: value.components.filter(item => item.status === "pending" && item.required)
        .length,
      pending_optional: value.components.filter(item => item.status === "pending" && !item.required)
        .length,
    };

    for (const key of Object.keys(expected) as (keyof typeof expected)[]) {
      if (value.counts[key] !== expected[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "curriculum counts do not match components",
          path: ["counts", key],
        });
      }
    }
  });

const gradeSchema = z
  .object({
    semester: shortTextSchema,
    code: shortTextSchema,
    discipline: mediumTextSchema,
    units: z.array(shortTextSchema).max(16),
    exam: nullableShortTextSchema,
    result: nullableShortTextSchema,
    absences: nullableShortTextSchema,
    status: nullableShortTextSchema,
  })
  .strict();

const classSchema = z
  .object({
    source_key: shortTextSchema,
    name: mediumTextSchema,
    code: nullableShortTextSchema,
    room: nullableMediumTextSchema,
    schedule_raw: nullableMediumTextSchema,
    semester: nullableShortTextSchema,
  })
  .strict();

const syncResponseSchema = z
  .object({
    schema_version: z.literal("1.0"),
    observed_at: z.string().datetime({ offset: true }),
    source: sourceSchema,
    student: studentSchema,
    curriculum: curriculumSchema,
    grades: z.array(gradeSchema).max(256),
    classes: z.array(classSchema).max(64),
  })
  .strict();

const wireFailureCodeSchema = z.enum([
  "UNAUTHORIZED",
  "CONNECTOR_MISCONFIGURED",
  "INVALID_REQUEST",
  "REQUEST_TOO_LARGE",
  "CONNECTOR_BUSY",
  "SIGAA_AUTH_FAILED",
  "SIGAA_IDENTITY_INVALID",
  "SIGAA_IDENTITY_MISMATCH",
  "SIGAA_TIMEOUT",
  "CONNECTOR_DEADLINE",
  "SIGAA_UNAVAILABLE",
  "SIGAA_RESPONSE_INVALID",
  "INTERNAL_ERROR",
]);

const errorResponseSchema = z
  .object({
    error: z
      .object({
        code: wireFailureCodeSchema,
        message: mediumTextSchema,
      })
      .strict(),
  })
  .strict();

type SyncWireResponse = z.infer<typeof syncResponseSchema>;
type WireFailureCode = z.infer<typeof wireFailureCodeSchema>;

const WIRE_FAILURE_STATUS = {
  UNAUTHORIZED: 401,
  CONNECTOR_MISCONFIGURED: 503,
  INVALID_REQUEST: 422,
  REQUEST_TOO_LARGE: 413,
  CONNECTOR_BUSY: 503,
  SIGAA_AUTH_FAILED: 401,
  SIGAA_IDENTITY_INVALID: 502,
  SIGAA_IDENTITY_MISMATCH: 409,
  SIGAA_TIMEOUT: 504,
  CONNECTOR_DEADLINE: 504,
  SIGAA_UNAVAILABLE: 503,
  SIGAA_RESPONSE_INVALID: 502,
  INTERNAL_ERROR: 500,
} as const satisfies Record<WireFailureCode, number>;

const WIRE_FAILURE_MAP = {
  UNAUTHORIZED: "CONNECTOR_MISCONFIGURED",
  CONNECTOR_MISCONFIGURED: "CONNECTOR_MISCONFIGURED",
  INVALID_REQUEST: "SIGAA_RESPONSE_INVALID",
  REQUEST_TOO_LARGE: "SIGAA_RESPONSE_INVALID",
  CONNECTOR_BUSY: "CONNECTOR_UNAVAILABLE",
  SIGAA_AUTH_FAILED: "SIGAA_AUTH_FAILED",
  SIGAA_IDENTITY_INVALID: "SIGAA_IDENTITY_INVALID",
  SIGAA_IDENTITY_MISMATCH: "SIGAA_IDENTITY_MISMATCH",
  SIGAA_TIMEOUT: "SIGAA_TIMEOUT",
  CONNECTOR_DEADLINE: "SIGAA_TIMEOUT",
  SIGAA_UNAVAILABLE: "SIGAA_UNAVAILABLE",
  SIGAA_RESPONSE_INVALID: "SIGAA_RESPONSE_INVALID",
  INTERNAL_ERROR: "CONNECTOR_UNAVAILABLE",
} as const satisfies Record<WireFailureCode, SigaaConnectorFailureCode>;

export function parseEphemeralCredentialInput(input: unknown): {
  username: string;
  password: string;
} {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    throw new TypeError("Invalid SIGAA credentials");
  }
  return parsed.data;
}

export function serializeSyncRequest(input: {
  username: string;
  password: string;
  expectedMatricula: string | null;
}): string {
  const parsed = syncRequestSchema.safeParse({
    username: input.username,
    password: input.password,
    expected_matricula: input.expectedMatricula,
  });
  if (!parsed.success) {
    throw new TypeError("Invalid SIGAA connector request");
  }
  return JSON.stringify(parsed.data);
}

export function decodeSyncResponse(
  body: string,
  connectorRequestId: string
): SigaaSnapshotCandidate {
  try {
    const wire = syncResponseSchema.parse(JSON.parse(body));
    return mapWireResponse(wire, connectorRequestId);
  } catch {
    throw new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
  }
}

export function decodeFailureResponse(
  body: string,
  status: number,
  connectorRequestId: string
): SigaaConnectorError {
  try {
    const wire = errorResponseSchema.parse(JSON.parse(body));
    if (WIRE_FAILURE_STATUS[wire.error.code] !== status) {
      throw new Error("status mismatch");
    }
    return new SigaaConnectorError(WIRE_FAILURE_MAP[wire.error.code], connectorRequestId);
  } catch {
    return new SigaaConnectorError("SIGAA_RESPONSE_INVALID", connectorRequestId);
  }
}

function mapWireResponse(
  wire: SyncWireResponse,
  connectorRequestId: string
): SigaaSnapshotCandidate {
  const seenComponentCodes = new Set<string>();
  const components = wire.curriculum.components.map(component => {
    const mapped = mapComponent(component);
    if (seenComponentCodes.has(mapped.code)) {
      throw new Error("duplicate normalized component code");
    }
    seenComponentCodes.add(mapped.code);
    return mapped;
  });

  return {
    contractVersion: wire.schema_version,
    connectorObservedAt: new Date(wire.observed_at),
    connectorRequestId,
    upstreamCommit: wire.source.upstream_commit,
    identity: {
      matricula: wire.student.matricula,
      sourceCourse: wire.student.course,
      sourceSemester: wire.student.semester,
    },
    curriculum: {
      code: wire.curriculum.curriculum,
      maximumCompletionTerm: wire.curriculum.maximum_completion_term,
      semesterWorkload: {
        minimum: wire.curriculum.semester_workload_hours.minimum,
        maximum: wire.curriculum.semester_workload_hours.maximum,
      },
      cra: wire.curriculum.cra,
      progress: wire.curriculum.progress.map(item => ({
        description: item.description,
        completedHours: item.completed_hours,
        totalHours: item.total_hours,
        remainingHours: item.remaining_hours,
        completedPercent: item.completed_percent,
      })),
      components,
    },
    grades: wire.grades.map(mapGrade),
    classes: wire.classes.map(mapClass),
  };
}

function mapComponent(
  component: SyncWireResponse["curriculum"]["components"][number]
): SigaaAcademicComponent {
  const unrecognizedStatus =
    component.status === "unknown" && component.status_raw !== null
      ? component.status_raw
      : undefined;
  const unrecognizedPeriod =
    component.period === null && component.period_raw !== null
      ? String(component.period_raw)
      : undefined;
  const unrecognizedSource =
    unrecognizedStatus !== undefined || unrecognizedPeriod !== undefined
      ? {
          ...(unrecognizedStatus === undefined ? {} : { status: unrecognizedStatus }),
          ...(unrecognizedPeriod === undefined ? {} : { period: unrecognizedPeriod }),
        }
      : undefined;

  return {
    code: normalizeDisciplineCode(component.code),
    name: component.name,
    integrationType: component.integration_type,
    period: component.period,
    workloadHours: component.workload_hours,
    required: component.required,
    status: component.status,
    prerequisite: component.prerequisite,
    corequisite: component.corequisite,
    ...(unrecognizedSource === undefined ? {} : { unrecognizedSource }),
  };
}

function mapGrade(grade: SyncWireResponse["grades"][number]): SigaaGrade {
  return {
    semester: grade.semester,
    code: normalizeDisciplineCode(grade.code),
    discipline: grade.discipline,
    units: grade.units,
    exam: grade.exam,
    result: grade.result,
    absences: grade.absences,
    status: grade.status,
  };
}

function mapClass(classData: SyncWireResponse["classes"][number]): SigaaClass {
  return {
    sourceKey: classData.source_key,
    name: classData.name,
    code: classData.code === null ? null : normalizeDisciplineCode(classData.code),
    room: classData.room,
    scheduleRaw: classData.schedule_raw,
    semester: classData.semester,
  };
}

function normalizeDisciplineCode(code: string): string {
  const normalized = code.normalize("NFKC").toUpperCase().replace(/\s+/gu, " ").trim();
  if (normalized.length === 0) {
    throw new Error("empty normalized discipline code");
  }
  return normalized;
}
