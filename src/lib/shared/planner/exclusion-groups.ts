import type { PlannerResult, PlannerSolution } from "./types";

type ExclusionItem = { code: string; name: string; detail?: string };

/** Keep rejected alternatives and viable-but-omitted disciplines in one explanation list. */
export function groupPlannerExclusions(
  result: PlannerResult,
  solution?: Pick<PlannerSolution, "omitted">
) {
  const groups = new Map<string, Map<string, ExclusionItem>>();
  const add = (reason: string, item: ExclusionItem) => {
    const items = groups.get(reason) ?? new Map<string, ExclusionItem>();
    items.set(item.code, item);
    groups.set(reason, items);
  };
  for (const item of result.exclusions) {
    for (const reason of item.reasons) {
      const prerequisite = "Pré-requisito não atendido: ";
      if (reason.startsWith(prerequisite)) {
        add("Pré-requisito não atendido", {
          code: item.code,
          name: item.name,
          detail: reason.slice(prerequisite.length),
        });
      } else if (reason.startsWith("Nenhuma turma localizada nas ofertas consultadas")) {
        add("Nenhuma turma localizada nas ofertas consultadas", {
          code: item.code,
          name: item.name,
        });
      } else {
        add(reason, { code: item.code, name: item.name });
      }
    }
  }
  for (const item of solution?.omitted ?? []) {
    if (item.reason === "combination") {
      add("Fora desta opção por limites, conflitos ou prioridades", item);
    } else if (
      !result.exclusions.some(
        exclusion => exclusion.code === item.code && exclusion.reasons.length > 0
      )
    ) {
      add("Sem opção viável nos filtros atuais", item);
    }
  }
  return [...groups].map(([reason, items]) => ({ reason, items: [...items.values()] }));
}
