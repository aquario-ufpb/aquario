import { createHash } from "crypto";

export const SIGAA_COURSE_ALIASES_VERSION = "ufpb-2026-09-02";

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

/**
 * SIGAA portal labels look like:
 * `CIÊNCIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa`
 *
 * Only the CI / João Pessoa suffix is recognized so Campina Grande, Rio Tinto,
 * Licenciatura EAD, etc. stay fail-closed.
 */
const CI_JOAO_PESSOA_PORTAL_SUFFIX = normalizeSigaaCourseName("/CI - João Pessoa");

const aliasGroups = [
  {
    canonicalName: "Ciência da Computação",
    aliases: [
      "Ciência da Computação",
      "Ciencia da Computacao",
      "Ciência da Computação (Bacharelado)",
      "Ciencia da Computacao (Bacharelado)",
      "Ciência da Computação - Bacharelado",
      "Ciencia da Computacao - Bacharelado",
      "Ciência da Computação - Graduação",
      "Ciencia da Computacao - Graduacao",
      "Computação - Graduação",
      "Computacao - Graduacao",
      "CIÊNCIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa",
      "CIENCIA DA COMPUTACAO (BACHARELADO)/CI - Joao Pessoa",
    ],
  },
  {
    canonicalName: "Engenharia da Computação",
    aliases: [
      "Engenharia da Computação",
      "Engenharia de Computação",
      "Engenharia da Computacao",
      "Engenharia de Computacao",
      "Engenharia da Computação (Bacharelado)",
      "Engenharia de Computação (Bacharelado)",
      "Engenharia da Computacao (Bacharelado)",
      "Engenharia de Computacao (Bacharelado)",
      "Engenharia da Computação - Bacharelado",
      "Engenharia de Computação - Bacharelado",
      "Engenharia da Computação - Graduação",
      "Engenharia de Computação - Graduação",
      "Engenharia da Computacao - Graduacao",
      "Engenharia de Computacao - Graduacao",
      "ENGENHARIA DA COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa",
      "ENGENHARIA DE COMPUTAÇÃO (BACHARELADO)/CI - João Pessoa",
      "ENGENHARIA DA COMPUTACAO (BACHARELADO)/CI - Joao Pessoa",
      "ENGENHARIA DE COMPUTACAO (BACHARELADO)/CI - Joao Pessoa",
    ],
  },
  {
    canonicalName: "Ciência de Dados e Inteligência Artificial",
    aliases: [
      "Ciência de Dados e Inteligência Artificial",
      "Ciencia de Dados e Inteligencia Artificial",
      "Ciência de Dados e IA",
      "Ciencia de Dados e IA",
      "Ciência de Dados e Inteligência Artificial (Bacharelado)",
      "Ciencia de Dados e Inteligencia Artificial (Bacharelado)",
      "Ciência de Dados e Inteligência Artificial - Bacharelado",
      "Ciência de Dados e Inteligência Artificial - Graduação",
      "Ciencia de Dados e Inteligencia Artificial - Graduacao",
      "CIÊNCIA DE DADOS E INTELIGÊNCIA ARTIFICIAL (BACHARELADO)/CI - João Pessoa",
      "CIENCIA DE DADOS E INTELIGENCIA ARTIFICIAL (BACHARELADO)/CI - Joao Pessoa",
    ],
  },
  {
    canonicalName: "Engenharia de Robôs",
    aliases: [
      "Engenharia de Robôs",
      "Engenharia de Robos",
      "Engenharia de Robôs (Bacharelado)",
      "Engenharia de Robos (Bacharelado)",
      "Engenharia de Robôs - Bacharelado",
      "Engenharia de Robôs - Graduação",
      "Engenharia de Robos - Graduacao",
      "ENGENHARIA DE ROBÔS (BACHARELADO)/CI - João Pessoa",
      "ENGENHARIA DE ROBOS (BACHARELADO)/CI - Joao Pessoa",
    ],
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

const stripCiJoaoPessoaPortalSuffix = (normalized: string): string | null => {
  if (!normalized.endsWith(CI_JOAO_PESSOA_PORTAL_SUFFIX)) {
    return null;
  }
  const stripped = normalized.slice(0, -CI_JOAO_PESSOA_PORTAL_SUFFIX.length).trim();
  return stripped.length > 0 ? stripped : null;
};

const canonicalNameFor = (value: string): string | null => {
  const normalized = normalizeSigaaCourseName(value);
  const direct = canonicalNamesByAlias.get(normalized);
  if (direct?.size === 1) {
    return [...direct][0];
  }

  const withoutPortalSuffix = stripCiJoaoPessoaPortalSuffix(normalized);
  if (withoutPortalSuffix) {
    const stripped = canonicalNamesByAlias.get(withoutPortalSuffix);
    if (stripped?.size === 1) {
      return [...stripped][0];
    }
  }

  return null;
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
