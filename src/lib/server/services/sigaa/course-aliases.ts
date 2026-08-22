export const SIGAA_COURSE_ALIASES_VERSION = "ufpb-2026-08-01";

const normalizeCourseName = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleUpperCase("pt-BR");

const aliasGroups = [
  [
    "Ciência da Computação",
    "Ciencia da Computacao",
    "Ciência da Computação (Bacharelado)",
    "Ciência da Computação - Bacharelado",
    "Computação - Graduação",
    "Computacao - Graduacao",
  ],
  [
    "Engenharia da Computação",
    "Engenharia de Computação",
    "Engenharia da Computação (Bacharelado)",
    "Engenharia de Computação (Bacharelado)",
  ],
  [
    "Ciência de Dados e Inteligência Artificial",
    "Ciência de Dados e IA",
    "Ciência de Dados e Inteligência Artificial (Bacharelado)",
  ],
  ["Engenharia de Robôs", "Engenharia de Robos", "Engenharia de Robôs (Bacharelado)"],
] as const;

const aliasesByName = new Map<string, ReadonlySet<string>>();
for (const group of aliasGroups) {
  const normalizedGroup = new Set(group.map(normalizeCourseName));
  for (const name of normalizedGroup) {
    aliasesByName.set(name, normalizedGroup);
  }
}

export function matchesVersionedSigaaCourseAlias(
  profileCourse: string,
  sigaaCourse: string
): boolean {
  const normalizedProfile = normalizeCourseName(profileCourse);
  const normalizedSigaa = normalizeCourseName(sigaaCourse);

  return aliasesByName.get(normalizedProfile)?.has(normalizedSigaa) === true;
}
