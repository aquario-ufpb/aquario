import { createHash } from "crypto";

export const SIGAA_COURSE_ALIASES_VERSION = "ufpb-2026-08-22";

export type SigaaCatalogCourse = Readonly<{
  id: string;
  name: string;
  centerId: string;
  centerName: string;
  centerAcronym: string;
}>;

export type SigaaCanonicalCourseResolution =
  | Readonly<{
      kind: "resolved";
      sourceLabel: string;
      canonicalName: string;
      target: SigaaCatalogCourse;
      targetCatalogToken: string;
    }>
  | Readonly<{
      kind: "blocked";
      reason: "source_missing" | "source_unrecognized" | "catalog_unavailable";
    }>;

export const normalizeSigaaCourseName = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleUpperCase("pt-BR");

const aliasGroups = [
  {
    canonicalName: "Ciência da Computação",
    aliases: [
      "Ciência da Computação",
      "Ciencia da Computacao",
      "Ciência da Computação (Bacharelado)",
      "Ciência da Computação - Bacharelado",
      "Computação - Graduação",
      "Computacao - Graduacao",
    ],
  },
  {
    canonicalName: "Engenharia da Computação",
    aliases: [
      "Engenharia da Computação",
      "Engenharia de Computação",
      "Engenharia da Computação (Bacharelado)",
      "Engenharia de Computação (Bacharelado)",
      "Engenharia da Computação - Graduação",
      "Engenharia de Computação - Graduação",
      "Engenharia da Computacao - Graduacao",
      "Engenharia de Computacao - Graduacao",
    ],
  },
  {
    canonicalName: "Ciência de Dados e Inteligência Artificial",
    aliases: [
      "Ciência de Dados e Inteligência Artificial",
      "Ciência de Dados e IA",
      "Ciência de Dados e Inteligência Artificial (Bacharelado)",
    ],
  },
  {
    canonicalName: "Engenharia de Robôs",
    aliases: ["Engenharia de Robôs", "Engenharia de Robos", "Engenharia de Robôs (Bacharelado)"],
  },
] as const;

const canonicalNamesByAlias = new Map<string, ReadonlySet<string>>();
for (const group of aliasGroups) {
  for (const alias of group.aliases) {
    const normalizedAlias = normalizeSigaaCourseName(alias);
    canonicalNamesByAlias.set(
      normalizedAlias,
      new Set([...(canonicalNamesByAlias.get(normalizedAlias) ?? []), group.canonicalName])
    );
  }
}

const digest = (value: string): string => createHash("sha256").update(value).digest("hex");

const canonicalNameFor = (value: string): string | null => {
  const matches = canonicalNamesByAlias.get(normalizeSigaaCourseName(value));
  return matches?.size === 1 ? [...matches][0] : null;
};

export const sigaaTargetCatalogToken = (course: SigaaCatalogCourse): string =>
  digest(
    [course.id, normalizeSigaaCourseName(course.name), course.centerId, course.centerName].join(
      "\u0000"
    )
  );

export const sigaaProfileAcademicIdentityToken = (input: {
  courseId: string;
  courseName: string;
  profileCenterId: string;
  catalogCenterId: string;
  catalogCenterName: string;
}): string =>
  digest(
    [
      input.courseId,
      normalizeSigaaCourseName(input.courseName),
      input.profileCenterId,
      input.catalogCenterId,
      input.catalogCenterName,
    ].join("\u0000")
  );

export function resolveVersionedSigaaCourse(
  sourceCourse: string | null,
  catalog: readonly SigaaCatalogCourse[]
): SigaaCanonicalCourseResolution {
  if (sourceCourse === null || sourceCourse.trim() === "") {
    return { kind: "blocked", reason: "source_missing" };
  }

  const canonicalName = canonicalNameFor(sourceCourse);
  if (!canonicalName) {
    return { kind: "blocked", reason: "source_unrecognized" };
  }

  const candidates = catalog.filter(course => canonicalNameFor(course.name) === canonicalName);
  if (candidates.length !== 1) {
    return { kind: "blocked", reason: "catalog_unavailable" };
  }

  return {
    kind: "resolved",
    sourceLabel: sourceCourse.trim(),
    canonicalName,
    target: candidates[0],
    targetCatalogToken: sigaaTargetCatalogToken(candidates[0]),
  };
}

export function matchesVersionedSigaaCourseAlias(
  profileCourse: string,
  sigaaCourse: string
): boolean {
  const profileCanonical = canonicalNameFor(profileCourse);
  return profileCanonical !== null && profileCanonical === canonicalNameFor(sigaaCourse);
}
