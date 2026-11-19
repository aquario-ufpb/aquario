import { z } from "zod";

import {
  sigaaAcademicSnapshotPayloadSchema,
  sigaaAcademicSnapshotPayloadShape,
  sigaaClassDeadlinesSchema,
  type SigaaAcademicSnapshotPayload,
} from "@/lib/shared/types/sigaa-academic";

const requiredText = (maximum: number) => z.string().min(1).max(maximum);
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
export type { SigaaAcademicSnapshotPayload };
export { sigaaAcademicSnapshotPayloadSchema };

export const sigaaSnapshotCandidateSchema = z
  .object({
    contractVersion: z.literal("1.0"),
    connectorObservedAt: z.date(),
    connectorRequestId: requiredText(64),
    upstreamCommit: gitCommitValueSchema,
    ...sigaaAcademicSnapshotPayloadShape,
  })
  .strict()
  .readonly();

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
    classes: candidate.classes.map(({ deadlines: _deadlines, ...currentClass }) => currentClass),
  });

const storedClassDeadlinesSchema = z
  .object({
    runId: z.string().uuid(),
    classes: z
      .array(
        z.object({ sourceKey: requiredText(64), deadlines: sigaaClassDeadlinesSchema }).strict()
      )
      .max(64),
  })
  .strict();

export function toStoredClassDeadlines(candidate: SigaaSnapshotCandidate, runId: string) {
  const classes = candidate.classes.flatMap(({ sourceKey, deadlines }) =>
    deadlines === undefined ? [] : [{ sourceKey, deadlines }]
  );
  return classes.length > 0 ? { runId, classes } : null;
}

export function attachStoredClassDeadlines(
  payload: SigaaAcademicSnapshotPayload,
  stored: unknown
): SigaaAcademicSnapshotPayload {
  if (stored === null) {
    return payload;
  }
  const { classes } = storedClassDeadlinesSchema.parse(stored);
  const byClass = new Map(classes.map(item => [item.sourceKey, item.deadlines]));
  return {
    ...payload,
    classes: payload.classes.map(item => {
      const deadlines = byClass.get(item.sourceKey);
      return deadlines === undefined ? item : { ...item, deadlines };
    }),
  };
}

export const sigaaMatriculaLockKey = (matricula: string): string => `sigaa:matricula:${matricula}`;
