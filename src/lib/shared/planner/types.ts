import { z } from "zod";

const text = z.string().trim().min(1).max(256);
export const semesterSchema = z.string().regex(/^20\d{2}\.[1-4]$/);
export const publicCourseIdSchema = z.string().regex(/^\d{1,12}$/);
const count = z.number().int().min(0).max(100000).nullable();
export const windowSchema = z
  .object({
    day: z.number().int().min(0).max(6),
    start: z.number().int().min(0).max(1439),
    end: z.number().int().min(1).max(1440),
    kind: z.enum(["available", "busy", "unavailable"]),
  })
  .strict()
  .refine(value => value.end > value.start, "O fim deve ser posterior ao início");
export type TimeWindow = z.infer<typeof windowSchema>;
export type Meeting = { day: number; start: number; end: number };
export type Requirement =
  | { kind: "code"; code: string }
  | { kind: "all" | "any"; items: Requirement[] }
  | { kind: "unknown"; raw: string };
const requirementSchema: z.ZodType<Requirement> = z.lazy(() =>
  z.union([
    z.object({ kind: z.literal("code"), code: text }).strict(),
    z
      .object({ kind: z.enum(["all", "any"]), items: z.array(requirementSchema).min(1).max(32) })
      .strict(),
    z.object({ kind: z.literal("unknown"), raw: z.string().max(2000) }).strict(),
  ])
);
export const offerSchema = z
  .object({
    id: text,
    code: text,
    name: text,
    section: text,
    semester: semesterSchema,
    schedule: z.string().max(512),
    teacher: z.string().max(1000),
    location: z.string().max(256).nullable(),
    coordinates: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .strict()
      .nullable(),
    source: z.enum(["SIGAA", "MANUAL"]),
    reservations: z.record(publicCourseIdSchema, count),
    totalSeats: count,
    availableSeats: count,
    demand: count,
    observedAt: z.string().datetime(),
    sourceUrl: z.string().url().max(2048).nullable(),
  })
  .strict();
export type PlannerOffer = z.infer<typeof offerSchema>;
export const goalSchema = z
  .object({
    code: text,
    name: text,
    priority: z.enum(["required", "high", "optional", "exclude"]),
    curricularRequired: z.boolean().optional(),
    period: z.number().int().min(0).max(100).nullable().optional(),
    equivalents: z.array(text).max(32),
    workload: count,
    prerequisite: requirementSchema.nullable(),
    corequisite: requirementSchema.nullable(),
    requirementsKnown: z.boolean(),
    completed: z.boolean(),
    unlocks: z.number().int().min(0).max(2048),
  })
  .strict();
export type PlannerGoal = z.infer<typeof goalSchema>;
const currentSettingsSchema = z
  .object({
    offerScope: z.enum(["curriculum", "course"]).default("curriculum"),
    includeOptional: z.boolean().default(true),
    respectAvailability: z.boolean().default(true),
    availabilityMode: z.enum(["blocked", "available"]),
    reservationMode: z.enum(["prefer", "only", "any"]),
    allowEquivalents: z.boolean(),
    allowWithoutReservation: z.boolean(),
    onlyAvailableSeats: z.boolean(),
    includeConditional: z.boolean(),
    minClasses: z.number().int().min(0).max(12),
    maxClasses: z.number().int().min(1).max(12),
    minWorkload: z.number().min(0).max(1000),
    maxWorkload: z.number().min(1).max(1000),
    maxDays: z.number().int().min(1).max(7),
    maxGapMinutes: z.number().int().min(0).max(1440),
    mode: z.enum(["priorities", "days", "gaps"]),
    progressStrategy: z.enum(["balanced", "unlock", "target"]).default("balanced"),
    progressTarget: text.nullable().default(null),
  })
  .strict()
  .refine(
    value => value.minClasses <= value.maxClasses && value.minWorkload <= value.maxWorkload,
    "Limites mínimos não podem superar os máximos"
  );
/** Read older saved scenarios while discarding retired location constraints. */
export const settingsSchema = z.preprocess(value => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const settings = { ...value } as Record<string, unknown>;
  delete settings.transferMinutes;
  delete settings.maxDistanceMeters;
  delete settings.requireLocations;
  if (settings.mode === "travel") {
    settings.mode = "priorities";
  }
  return settings;
}, currentSettingsSchema);
export const draftSchema = z
  .object({
    version: z.literal(1),
    semester: semesterSchema,
    courseId: publicCourseIdSchema.nullable(),
    windows: z.array(windowSchema).max(224),
    settings: settingsSchema,
    priorityOrder: z.array(text).max(2048).default([]),
    priorities: z.record(z.enum(["required", "high", "optional", "exclude"])),
    fixedOfferIds: z.array(text).max(12),
    excludedOfferIds: z.array(text).max(1500).default([]),
    customGoals: z.array(goalSchema).max(30),
    offers: z.array(offerSchema).max(1500),
  })
  .strict();
export type PlannerDraft = z.infer<typeof draftSchema>;
export type PlanSummary = {
  id: string;
  name: string;
  semester: string;
  profileCourseId: string;
  updatedAt: string;
};
export type SavedPlan = PlanSummary & { draft: PlannerDraft };
export type PlannerSettings = z.infer<typeof settingsSchema>;
export type PlannerInput = {
  semester: string;
  courseId: string | null;
  goals: PlannerGoal[];
  offers: PlannerOffer[];
  windows: TimeWindow[];
  settings: PlannerSettings;
  fixedOfferIds: string[];
  excludedOfferIds?: string[];
  completedCodes: string[];
  assumedPassedCodes: string[];
  priorityOrder?: string[];
  institutionalWorkload?: { minimum: number | null; maximum: number | null };
};
export type Selection = { goal: PlannerGoal; offer: PlannerOffer; conditional: string[] };
export type PlannerProgress = {
  strategy: "balanced" | "unlock" | "target";
  target: { code: string; name: string } | null;
  unlocked: { code: string; name: string }[];
  paths: { code: string; name: string }[][];
  remaining: { code: string; name: string }[];
  warnings: string[];
};
export type PlannerSolution = {
  progress?: PlannerProgress;
  id: string;
  selections: Selection[];
  score: number[];
  workload: number;
  days: number;
  gapMinutes: number;
  reserved: number;
  conditional: string[];
  omitted: { code: string; name: string; reason: "filters" | "combination" }[];
};
export type PlannerBlockingChoice = {
  kind: "required" | "fixed";
  code: string;
  name: string;
  offerId?: string;
  section?: string;
  reasons: string[];
};
export type PlannerResult = {
  blockingChoices?: PlannerBlockingChoice[];
  solutions: PlannerSolution[];
  exclusions: { code: string; name: string; reasons: string[] }[];
  limited: boolean;
  explored: number;
  message: string;
};
export type PublicCourse = { id: string; name: string; campus: string; modality: string };
export const offeringResponseSchema = z
  .object({
    offers: z.array(offerSchema).max(1500),
    observedAt: z.string().datetime(),
    course: z
      .object({
        id: publicCourseIdSchema,
        name: text,
        campus: z.string().max(256),
        modality: z.string().max(256),
      })
      .strict(),
    warnings: z.array(z.string().max(2000)).max(100),
  })
  .strict();
export type OfferingResponse = z.infer<typeof offeringResponseSchema>;
export const defaultSettings: PlannerSettings = {
  offerScope: "curriculum",
  includeOptional: true,
  respectAvailability: true,
  availabilityMode: "blocked",
  reservationMode: "prefer",
  allowEquivalents: true,
  allowWithoutReservation: true,
  onlyAvailableSeats: false,
  includeConditional: false,
  minClasses: 1,
  maxClasses: 6,
  minWorkload: 0,
  maxWorkload: 420,
  maxDays: 6,
  maxGapMinutes: 1440,
  mode: "priorities",
  progressStrategy: "balanced",
  progressTarget: null,
};
export function emptyDraft(semester: string): PlannerDraft {
  return {
    version: 1,
    semester,
    courseId: null,
    windows: [],
    settings: {
      ...defaultSettings,
      minWorkload: 180,
      offerScope: "course",
      reservationMode: "only",
      allowWithoutReservation: false,
    },
    priorityOrder: [],
    priorities: {},
    fixedOfferIds: [],
    excludedOfferIds: [],
    customGoals: [],
    offers: [],
  };
}
