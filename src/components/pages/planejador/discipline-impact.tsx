import type {
  DisciplineImpact,
  DisciplineImpactItem,
} from "@/lib/shared/planner/discipline-impact";

function ImpactList({ title, items }: { title: string; items: DisciplineImpactItem[] }) {
  if (!items.length) {
    return null;
  }
  const render = (item: DisciplineImpactItem) => (
    <li key={item.code} className="space-y-0.5">
      <p>
        {item.name} <span className="text-muted-foreground">· {item.code}</span>
      </p>
      {item.detail && <p className="text-muted-foreground">{item.detail}</p>}
    </li>
  );
  return (
    <div className="space-y-1">
      <h4 className="font-medium">
        {title} ({items.length})
      </h4>
      <ul className="space-y-2">{items.slice(0, 3).map(render)}</ul>
      {items.length > 3 && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Ver mais ({items.length - 3})
          </summary>
          <ul className="mt-2 space-y-2">{items.slice(3).map(render)}</ul>
        </details>
      )}
    </div>
  );
}
export function DisciplineImpactDetails({ impact }: { impact: DisciplineImpact }) {
  if (!impact.prerequisite && !impact.unlocked.length && !impact.pending.length) {
    return null;
  }
  return (
    <div
      className="mt-2 space-y-3 border-t pt-3 text-xs"
      aria-label="Pré-requisitos e continuidade da disciplina"
    >
      {impact.prerequisite && (
        <div className="space-y-1">
          <h4 className="font-medium">
            Pré-requisitos{" "}
            <span
              className={
                impact.prerequisite.state === "met"
                  ? "font-normal text-emerald-700 dark:text-emerald-400"
                  : "font-normal text-amber-700 dark:text-amber-400"
              }
            >
              ·{" "}
              {impact.prerequisite.state === "met"
                ? "atendidos"
                : impact.prerequisite.state === "unmet"
                  ? "pendentes"
                  : "a verificar"}
            </span>
          </h4>
          <p className="text-muted-foreground">{impact.prerequisite.description}</p>
        </div>
      )}
      <ImpactList title="Libera pré-requisitos após aprovação" items={impact.unlocked} />
      <ImpactList title="Abre caminho, mas ainda faltam outras" items={impact.pending} />
    </div>
  );
}
