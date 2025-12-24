import type { Professor, ProfessorSlug } from "./types";
import { professors as ciProfessors } from "@/content/aquario-mapas/centro-de-informatica/professores";

function resolveProfessorImagePath(image?: string): string | undefined {
  if (!image) {
    return undefined;
  }

  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }

  let normalized = image.replace(/^\.?\//, "");

  if (normalized.startsWith("mapas/")) {
    normalized = normalized.replace(/^mapas\//, "");
    return `/api/content-images/${normalized}`;
  }

  if (normalized.startsWith("centro-de-informatica/")) {
    return `/api/content-images/mapas/${normalized}`;
  }

  return `/api/content-images/mapas/centro-de-informatica/${normalized}`;
}

const allProfessors: Professor[] = ciProfessors.map(professor => ({
  ...professor,
  image: resolveProfessorImagePath(professor.image),
}));

const professorsMap = new Map<ProfessorSlug, Professor>();
for (const professor of allProfessors) {
  professorsMap.set(professor.id, professor);
}

export function getProfessorById(id: ProfessorSlug): Professor | undefined {
  return professorsMap.get(id);
}

export function getProfessorName(id: ProfessorSlug): string {
  return getProfessorById(id)?.name ?? id;
}

export function getProfessorsByIds(ids: ProfessorSlug[]): Professor[] {
  return ids
    .map(id => {
      const professor = getProfessorById(id);
      return professor ?? { id, name: id };
    })
    .filter((professor): professor is Professor => Boolean(professor));
}
