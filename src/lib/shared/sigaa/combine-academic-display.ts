import type {
  CatalogAcademicComponent,
  EffectiveAcademicComponent,
  ManualAcademicComponent,
  SigaaAcademicComponent,
} from "@/lib/shared/types/sigaa-academic";

type CombineAcademicDisplayInput = Readonly<{
  catalog: readonly CatalogAcademicComponent[];
  manual: readonly ManualAcademicComponent[];
  sigaa: readonly SigaaAcademicComponent[];
}>;

type ManualAcademicSources = Readonly<{
  catalog: readonly CatalogAcademicComponent[];
  completed: readonly Readonly<{
    disciplinaId: string;
    code: string;
    name: string;
  }>[];
  enrolled: readonly Readonly<{ disciplinaId: string; code: string; name: string }>[];
}>;

export const normalizeAcademicCode = (code: string): string =>
  code.normalize("NFKC").toUpperCase().replace(/\s+/gu, " ").trim();

export function collectManualAcademicComponents({
  catalog,
  completed,
  enrolled,
}: ManualAcademicSources): readonly ManualAcademicComponent[] {
  const completedById = new Map(completed.map(item => [item.disciplinaId, item]));
  const enrolledIds = new Set(enrolled.map(item => item.disciplinaId));
  const manualByCode = new Map<string, ManualAcademicComponent>();

  for (const item of catalog) {
    const code = normalizeAcademicCode(item.code);
    const completedItem = completedById.get(item.disciplinaId);
    if (completedItem) {
      manualByCode.set(code, {
        disciplinaId: item.disciplinaId,
        code,
        name: completedItem.name,
        state: "completed",
      });
    } else if (enrolledIds.has(item.disciplinaId)) {
      manualByCode.set(code, {
        disciplinaId: item.disciplinaId,
        code,
        name: item.name,
        state: "enrolled",
      });
    }
  }

  for (const item of completed) {
    const code = normalizeAcademicCode(item.code);
    if (!manualByCode.has(code)) {
      manualByCode.set(code, { ...item, code, state: "completed" });
    }
  }

  for (const item of enrolled) {
    const code = normalizeAcademicCode(item.code);
    if (!manualByCode.has(code)) {
      const catalogItem = catalog.find(candidate => candidate.disciplinaId === item.disciplinaId);
      manualByCode.set(code, {
        disciplinaId: item.disciplinaId,
        code,
        name: catalogItem?.name ?? item.name,
        state: "enrolled",
      });
    }
  }

  return Array.from(manualByCode.values());
}

export function combineAcademicDisplay({
  catalog,
  manual,
  sigaa,
}: CombineAcademicDisplayInput): readonly EffectiveAcademicComponent[] {
  const catalogByCode = new Map(catalog.map(item => [normalizeAcademicCode(item.code), item]));
  const manualByCode = new Map(manual.map(item => [normalizeAcademicCode(item.code), item]));
  const sigaaByCode = new Map(sigaa.map(item => [normalizeAcademicCode(item.code), item]));
  const orderedCodes = new Set([
    ...catalog.map(item => normalizeAcademicCode(item.code)),
    ...manual.map(item => normalizeAcademicCode(item.code)),
    ...sigaa.map(item => normalizeAcademicCode(item.code)),
  ]);

  return Array.from(orderedCodes, code => {
    const catalogItem = catalogByCode.get(code) ?? null;
    const manualItem = manualByCode.get(code) ?? null;
    const sigaaItem = sigaaByCode.get(code) ?? null;

    if (sigaaItem) {
      return {
        code,
        catalog: catalogItem,
        manual: manualItem,
        sigaa: sigaaItem,
        presentation: { origin: "SIGAA", state: sigaaItem.status, name: sigaaItem.name },
      };
    }

    if (manualItem) {
      return {
        code,
        catalog: catalogItem,
        manual: manualItem,
        sigaa: null,
        presentation: {
          origin: "MANUAL",
          state: manualItem.state,
          name: manualItem.name,
        },
      };
    }

    return {
      code,
      catalog: catalogItem,
      manual: null,
      sigaa: null,
      presentation: { origin: "CATALOG", state: "pending", name: catalogItem?.name ?? code },
    };
  });
}
