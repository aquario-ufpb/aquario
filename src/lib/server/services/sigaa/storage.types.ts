import { z } from "zod";

const requiredText = (maximum: number) => z.string().min(1).max(maximum);
const nullableText = (maximum: number) => requiredText(maximum).nullable();
const hourCountSchema = z.number().int().min(0).max(100_000);
const matriculaValueSchema = z.string().regex(/^\d{11}$/);
const gitCommitValueSchema = z.string().regex(/^[0-9a-f]{40}$/);

export const usuarioIdSchema = z.string().uuid().brand<"UsuarioId">();
export const sigaaRunIdSchema = z.string().uuid().brand<"SigaaRunId">();
export const idempotencyKeySchema = z.string().uuid().brand<"IdempotencyKey">();
export const leaseSecretSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/)
  .brand<"LeaseSecret">();
export const matriculaSchema = matriculaValueSchema.brand<"Matricula">();
export const gitCommitSchema = gitCommitValueSchema.brand<"GitCommit">();

export type UsuarioId = z.infer<typeof usuarioIdSchema>;
export type SigaaRunId = z.infer<typeof sigaaRunIdSchema>;
export type IdempotencyKey = z.infer<typeof idempotencyKeySchema>;
export type LeaseSecret = z.infer<typeof leaseSecretSchema>;
export type Matricula = z.infer<typeof matriculaSchema>;
export type GitCommit = z.infer<typeof gitCommitSchema>;

const componentStatusSchema = z.enum(["completed", "enrolled", "pending", "unknown"]);

const workloadProgressSchema = z
  .object({
    description: requiredText(256),
    completedHours: hourCountSchema,
    totalHours: hourCountSchema,
    remainingHours: hourCountSchema,
    completedPercent: z.number().min(0).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.completedHours > value.totalHours) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "completed hours exceed total hours",
        path: ["completedHours"],
      });
    }
    if (value.remainingHours !== value.totalHours - value.completedHours) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "remaining hours do not match total and completed hours",
        path: ["remainingHours"],
      });
    }
  })
  .readonly();

const unrecognizedSourceSchema = z
  .object({
    status: requiredText(64).optional(),
    period: requiredText(32).optional(),
  })
  .strict()
  .refine(value => value.status !== undefined || value.period !== undefined)
  .readonly();

const academicComponentSchema = z
  .object({
    code: requiredText(64),
    name: requiredText(256),
    integrationType: requiredText(64),
    period: z.number().int().min(0).max(100).nullable(),
    workloadHours: hourCountSchema,
    required: z.boolean(),
    status: componentStatusSchema,
    prerequisite: nullableText(256),
    corequisite: nullableText(256),
    unrecognizedSource: unrecognizedSourceSchema.optional(),
  })
  .strict()
  .readonly();

const gradeSchema = z
  .object({
    semester: requiredText(64),
    code: requiredText(64),
    discipline: requiredText(256),
    units: z.array(requiredText(64)).max(16).readonly(),
    exam: nullableText(64),
    result: nullableText(64),
    absences: nullableText(64),
    status: nullableText(64),
  })
  .strict()
  .readonly();

const classSchema = z
  .object({
    sourceKey: requiredText(64),
    name: requiredText(256),
    code: nullableText(64),
    room: nullableText(256),
    scheduleRaw: nullableText(256),
    semester: nullableText(64),
  })
  .strict()
  .readonly();

const identitySchema = z
  .object({
    matricula: matriculaValueSchema,
    sourceCourse: nullableText(256),
    sourceSemester: nullableText(64),
  })
  .strict()
  .readonly();

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
  })
  .readonly();

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
  .strict()
  .readonly();

const curriculumSchema = z
  .object({
    code: requiredText(64),
    maximumCompletionTerm: nullableText(64),
    semesterWorkload: semesterWorkloadSchema,
    cra: craSchema,
    progress: z.array(workloadProgressSchema).max(64).readonly(),
    components: z.array(academicComponentSchema).max(2_048).readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    const seenCodes = new Set<string>();
    value.components.forEach((component, index) => {
      if (seenCodes.has(component.code)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duplicate normalized component code",
          path: ["components", index, "code"],
        });
      }
      seenCodes.add(component.code);
    });
  })
  .readonly();

const academicPayloadShape = {
  identity: identitySchema,
  curriculum: curriculumSchema,
  grades: z.array(gradeSchema).max(256).readonly(),
  classes: z.array(classSchema).max(64).readonly(),
};

export const sigaaAcademicSnapshotPayloadSchema = z
  .object(academicPayloadShape)
  .strict()
  .readonly();

export const sigaaSnapshotCandidateSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    connectorObservedAt: z.date(),
    connectorRequestId: requiredText(64),
    upstreamCommit: gitCommitValueSchema,
    ...academicPayloadShape,
  })
  .strict()
  .readonly();

export type SigaaAcademicSnapshotPayload = z.infer<typeof sigaaAcademicSnapshotPayloadSchema>;
export type SigaaSnapshotCandidate = z.infer<typeof sigaaSnapshotCandidateSchema>;

export const parseSigaaAcademicSnapshotPayload = (value: unknown): SigaaAcademicSnapshotPayload =>
  sigaaAcademicSnapshotPayloadSchema.parse(value);

export const parseSigaaSnapshotCandidate = (value: unknown): SigaaSnapshotCandidate =>
  sigaaSnapshotCandidateSchema.parse(value);

export const toSigaaAcademicSnapshotPayload = (
  candidate: SigaaSnapshotCandidate
): SigaaAcademicSnapshotPayload =>
  sigaaAcademicSnapshotPayloadSchema.parse({
    identity: candidate.identity,
    curriculum: candidate.curriculum,
    grades: candidate.grades,
    classes: candidate.classes,
  });

export const sigaaMatriculaLockKey = (matricula: string): string => `sigaa:matricula:${matricula}`;
