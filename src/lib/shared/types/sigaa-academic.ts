import { z } from "zod";

const requiredText = (maximum: number) => z.string().min(1).max(maximum);
const nullableText = (maximum: number) => requiredText(maximum).nullable();
const hourCountSchema = z.number().int().min(0).max(100_000);

export const sigaaComponentStateSchema = z.enum(["completed", "enrolled", "pending", "unknown"]);

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

export const sigaaAcademicComponentSchema = z
  .object({
    code: requiredText(64),
    name: requiredText(256),
    integrationType: requiredText(64),
    period: z.number().int().min(0).max(100).nullable(),
    workloadHours: hourCountSchema,
    required: z.boolean(),
    status: sigaaComponentStateSchema,
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
    matricula: z.string().regex(/^\d{11}$/),
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
    components: z.array(sigaaAcademicComponentSchema).max(2_048).readonly(),
  })
  .strict()
  .superRefine((value, context) => {
    const seenCodes = new Set<string>();
    value.components.forEach((component, index) => {
      const normalizedCode = component.code.trim().toUpperCase();
      if (seenCodes.has(normalizedCode)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duplicate normalized component code",
          path: ["components", index, "code"],
        });
      }
      seenCodes.add(normalizedCode);
    });
  })
  .readonly();

export const sigaaAcademicSnapshotPayloadShape = {
  identity: identitySchema,
  curriculum: curriculumSchema,
  grades: z.array(gradeSchema).max(256).readonly(),
  classes: z.array(classSchema).max(64).readonly(),
};

export const sigaaAcademicSnapshotPayloadSchema = z
  .object(sigaaAcademicSnapshotPayloadShape)
  .strict()
  .readonly();

export type SigaaComponentState = z.infer<typeof sigaaComponentStateSchema>;
export type SigaaAcademicComponent = z.infer<typeof sigaaAcademicComponentSchema>;
export type SigaaAcademicSnapshotPayload = z.infer<typeof sigaaAcademicSnapshotPayloadSchema>;

export type CatalogAcademicComponent = Readonly<{
  disciplinaId: string;
  code: string;
  name: string;
}>;

export type ManualAcademicComponent = Readonly<{
  code: string;
  state: "completed" | "enrolled";
}>;

export type AcademicDisplayPresentation =
  | Readonly<{ origin: "SIGAA"; state: SigaaComponentState; name: string }>
  | Readonly<{ origin: "MANUAL"; state: "completed" | "enrolled"; name: string }>
  | Readonly<{ origin: "CATALOG"; state: "pending"; name: string }>;

export type EffectiveAcademicComponent = Readonly<{
  code: string;
  catalog: CatalogAcademicComponent | null;
  manual: ManualAcademicComponent | null;
  sigaa: SigaaAcademicComponent | null;
  presentation: AcademicDisplayPresentation;
}>;
