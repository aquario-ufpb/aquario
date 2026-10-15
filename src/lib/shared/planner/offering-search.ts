import { z } from "zod";
import { publicCourseIdSchema, semesterSchema, type OfferingResponse } from "./types";
export const offeringBatchSchema = z
  .object({
    semester: semesterSchema,
    refresh: z.boolean().optional(),
    courseIds: z.array(publicCourseIdSchema).min(1).max(4),
    codes: z
      .array(z.string().regex(/^[A-Z0-9]{1,64}$/))
      .min(1)
      .max(2048),
  })
  .strict();
export type OfferingBatchRequest = z.infer<typeof offeringBatchSchema>;
export type OfferingBatchResponse = { results: OfferingResponse[]; failedCourseIds: string[] };

export const offeringSnapshotSchema = offeringBatchSchema
  .omit({ refresh: true })
  .extend({ courseIds: z.array(publicCourseIdSchema).min(1).max(200) });
export type OfferingSnapshotRequest = z.infer<typeof offeringSnapshotSchema>;
export type OfferingSnapshotResponse = { results: OfferingResponse[]; missingCourseIds: string[] };
