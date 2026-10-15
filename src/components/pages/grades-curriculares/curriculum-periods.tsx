"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, BookOpen, Circle } from "lucide-react";
import type { GradeDisciplinaNode } from "@/lib/shared/types";
import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";

type Props = {
  periods: [number, GradeDisciplinaNode[]][];
  completedIds?: Set<string>;
  cursandoIds?: Set<string>;
  selectionMode: boolean;
  selectedIds: Set<string>;
  expandMatches: boolean;
  onSelect: (id: string) => void;
  onOpen: (disc: GradeDisciplinaNode) => void;
  onTogglePeriod: (discs: GradeDisciplinaNode[]) => void;
  canTogglePeriod: (discs: GradeDisciplinaNode[]) => boolean;
  isPeriodSelected: (discs: GradeDisciplinaNode[]) => boolean;
};

export function CurriculumPeriods(props: Props) {
  return (
    <div
      className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Disciplinas por período"
    >
      {[...props.periods]
        .sort(([a], [b]) => (a === 0 ? Infinity : a) - (b === 0 ? Infinity : b))
        .map(([period, discs]) => (
          <PeriodCard key={period} {...props} period={period} discs={discs} />
        ))}
    </div>
  );
}

function PeriodCard({
  period,
  discs,
  completedIds,
  cursandoIds,
  selectionMode,
  selectedIds,
  expandMatches,
  onSelect,
  onOpen,
  onTogglePeriod,
  canTogglePeriod,
  isPeriodSelected,
}: Props & { period: number; discs: GradeDisciplinaNode[] }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(period !== 0 && window.matchMedia("(min-width: 640px)").matches);
  }, [period]);
  const [showAll, setShowAll] = useState(false);
  const isOpen = expanded || expandMatches || selectionMode;
  const title = period === 0 ? "Sem período definido" : `${period}º período`;
  const completed = discs.filter(d => completedIds?.has(d.disciplinaId)).length;
  const workload = discs.some(d => d.cargaHorariaTotal !== null)
    ? `${discs.reduce((sum, d) => sum + (d.cargaHorariaTotal ?? 0), 0)}h`
    : "carga a confirmar";
  const visible = showAll || expandMatches || selectionMode ? discs : discs.slice(0, 6);
  return (
    <section
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-label={title}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`period-disciplines-${period}`}
        onClick={() => setExpanded(value => !value)}
        disabled={expandMatches || selectionMode}
        className="flex w-full items-center justify-between gap-2 bg-muted/40 p-3 text-left hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-100"
      >
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {discs.length} {discs.length === 1 ? "disciplina" : "disciplinas"} · {workload}
            {completedIds ? ` · ${completed} concluídas` : ""}
          </span>
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        )}
      </button>
      <div id={`period-disciplines-${period}`} hidden={!isOpen}>
        {selectionMode && canTogglePeriod(discs) && (
          <Button
            size="sm"
            variant="ghost"
            className="m-1 text-xs"
            aria-pressed={isPeriodSelected(discs)}
            aria-label={`${isPeriodSelected(discs) ? "Desmarcar" : "Marcar"} obrigatórias do ${title}`}
            onClick={() => onTogglePeriod(discs)}
          >
            {isPeriodSelected(discs) ? "Desmarcar" : "Marcar"} obrigatórias
          </Button>
        )}
        <ul className="divide-y px-2">
          {visible.map(disc => {
            const done = !!completedIds?.has(disc.disciplinaId);
            const enrolled = !!cursandoIds?.has(disc.disciplinaId);
            const selected = selectedIds.has(disc.disciplinaId);
            const Icon = done ? CheckCircle2 : enrolled ? BookOpen : Circle;
            return (
              <li key={disc.id} className="py-1">
                <button
                  type="button"
                  aria-pressed={selectionMode ? selected : undefined}
                  onClick={() => (selectionMode ? onSelect(disc.disciplinaId) : onOpen(disc))}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    done && "bg-emerald-50/60 dark:bg-emerald-950/20",
                    enrolled && !done && "bg-purple-50/60 dark:bg-purple-950/20",
                    selectionMode && selected && "bg-primary/10 ring-1 ring-inset ring-primary"
                  )}
                >
                  <Icon
                    size={14}
                    aria-hidden="true"
                    className={cn(
                      "mt-1 shrink-0",
                      done
                        ? "text-emerald-600 dark:text-emerald-400"
                        : enrolled
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-muted-foreground/40"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-medium leading-snug">
                      {disc.nome}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-1.5 text-[11px] text-muted-foreground">
                      <span>{disc.codigo}</span>
                      {disc.cargaHorariaTotal !== null && <span>· {disc.cargaHorariaTotal}h</span>}
                      {disc.natureza !== "OBRIGATORIA" && (
                        <span className="text-amber-700 dark:text-amber-400">
                          · {disc.natureza === "OPTATIVA" ? "Optativa" : "Complementar"}
                        </span>
                      )}
                    </span>
                    {(done || enrolled || (selectionMode && selected)) && (
                      <span className="mt-1 block text-[11px] font-medium">
                        {selectionMode && selected
                          ? "Selecionada"
                          : done
                            ? "Concluída"
                            : "Cursando"}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {discs.length > 6 && !expandMatches && !selectionMode && (
          <Button
            variant="ghost"
            size="sm"
            className="m-1 text-xs"
            onClick={() => setShowAll(value => !value)}
          >
            {showAll
              ? "Mostrar menos"
              : `Ver mais ${discs.length - 6} ${discs.length - 6 === 1 ? "disciplina" : "disciplinas"}`}
          </Button>
        )}
      </div>
    </section>
  );
}
