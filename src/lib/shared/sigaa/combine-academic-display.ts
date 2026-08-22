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
  completedDisciplineIds: readonly string[];
  enrolled: readonly Readonly<{ disciplinaId: string; code: string }>[];
}>;

const normalizeCode = (code: string): string => code.trim().toUpperCase();

export function collectManualAcademicComponents({
  catalog,
  completedDisciplineIds,
  enrolled,
}: ManualAcademicSources): readonly ManualAcademicComponent[] {
  const completedIds = new Set(completedDisciplineIds);
  const enrolledIds = new Set(enrolled.map(item => item.disciplinaId));
  const manualByCode = new Map<string, ManualAcademicComponent>();

  for (const item of catalog) {
    const code = normalizeCode(item.code);
    if (completedIds.has(item.disciplinaId)) {
      manualByCode.set(code, { code, state: "completed" });
    } else if (enrolledIds.has(item.disciplinaId)) {
      manualByCode.set(code, { code, state: "enrolled" });
    }
  }

  for (const item of enrolled) {
    const code = normalizeCode(item.code);
    if (!manualByCode.has(code)) {
      manualByCode.set(code, { code, state: "enrolled" });
    }
  }

  return Array.from(manualByCode.values());
}

export function combineAcademicDisplay({
  catalog,
  manual,
  sigaa,
}: CombineAcademicDisplayInput): readonly EffectiveAcademicComponent[] {
  const catalogByCode = new Map(catalog.map(item => [normalizeCode(item.code), item]));
  const manualByCode = new Map(manual.map(item => [normalizeCode(item.code), item]));
  const sigaaByCode = new Map(sigaa.map(item => [normalizeCode(item.code), item]));
  const orderedCodes = new Set([
    ...catalog.map(item => normalizeCode(item.code)),
    ...manual.map(item => normalizeCode(item.code)),
    ...sigaa.map(item => normalizeCode(item.code)),
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
          name: catalogItem?.name ?? code,
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
