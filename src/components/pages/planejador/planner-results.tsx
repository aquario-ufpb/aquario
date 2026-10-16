"use client";
import { useEffect, useRef, useState } from "react";
import { Anchor, Arrow } from "@radix-ui/react-popover";
import { Pin, Ban, X, Route, Download, Check, ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CalendarGridTable } from "@/components/pages/calendario/calendar-grid-table";
import { CalendarMobileView } from "@/components/pages/calendario/calendar-mobile-view";
import type { ClassWithRoom } from "@/components/pages/calendario/types";
import { PLANNER_CLASS_COLORS } from "@/lib/shared/planner/display";
import { formatHorario } from "@/lib/shared/calendario/utils";
import { downloadScheduleImage } from "@/lib/client/planner/export-schedule-image";
import { groupPlannerExclusions } from "@/lib/shared/planner/exclusion-groups";
import { getDisciplineImpact } from "@/lib/shared/planner/discipline-impact";
import { DisciplineImpactDetails } from "./discipline-impact";
import type { PlannerGoal, PlannerResult } from "@/lib/shared/planner/types";

export function PlannerResults({
  result,
  semester,
  goals,
  completedCodes,
  assumedPassedCodes,
  fixedOfferIds,
  excludedOfferIds,
  requiredCodes,
  needsRecalculation,
  calculating,
  onRecalculate,
  onUnfix,
  onUnrequire,
  onToggleFix,
  onExclude,
  onFix,
}: {
  result: PlannerResult;
  semester: string;
  goals: PlannerGoal[];
  completedCodes: string[];
  assumedPassedCodes: string[];
  fixedOfferIds: string[];
  excludedOfferIds: string[];
  requiredCodes: string[];
  needsRecalculation: boolean;
  calculating: boolean;
  onRecalculate: () => void;
  onUnfix: (id: string) => void;
  onUnrequire: (code: string) => void;
  onToggleFix: (id: string) => void;
  onExclude: (id: string) => void;
  onFix: (ids: string[]) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selected, setSelected] = useState(0);
  const anchorRef = useRef<HTMLElement | null>(null);
  const [activeClass, setActiveClass] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    // A recalculation can return fewer alternatives than the previous result.
    setSelected(0);
    setActiveClass(null);
  }, [result]);
  const solution = result.solutions[selected];
  const classes: ClassWithRoom[] =
    solution?.selections.map(({ offer }, index) => ({
      id: index + 1,
      codigo: offer.code,
      nome: offer.name,
      turma: offer.section,
      horario: offer.schedule,
      docente: offer.teacher,
      departamento: "",
      alunos: "",
      preferencias: [],
      pcd: 0,
      preAlocacao: null,
      paasRoomSolutionId: 0,
      room: { bloco: "", nome: offer.location ?? "Local a confirmar" },
    })) ?? [];
  const colors = new Map(
    classes.map((item, index) => [
      item.id,
      PLANNER_CLASS_COLORS[index % PLANNER_CLASS_COLORS.length],
    ])
  );
  const activeOffer =
    activeClass === null ? undefined : solution?.selections[activeClass - 1]?.offer;
  const activeGoalCode =
    activeClass === null ? null : solution?.selections[activeClass - 1]?.goal.code;
  const activeImpact = activeGoalCode
    ? getDisciplineImpact(activeGoalCode, goals, completedCodes, assumedPassedCodes)
    : null;
  const openClassActions = (
    items: ClassWithRoom[],
    _day: number,
    _slot: number,
    anchor?: HTMLElement
  ) => {
    if (!anchor) {
      return;
    }
    anchorRef.current = anchor;
    setActiveClass(items[0]?.id ?? null);
  };
  const groupedExclusions = groupPlannerExclusions(result, solution);
  const exportImage = async () => {
    if (!solution) {
      return;
    }
    setExporting(true);
    try {
      await downloadScheduleImage(solution, semester);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível exportar a imagem.");
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="space-y-4" aria-label="Resultados do planejamento">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Seu planejamento
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Combinações para comparar</h2>
        </div>
        <a
          href="#planner-availability"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={13} />
          Editar horários
        </a>
      </div>
      <p role="status" className="text-sm">
        {result.message}
      </p>
      {(needsRecalculation || calculating) && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
        >
          <p className="text-sm">
            {calculating
              ? "Atualizando combinações… O resultado anterior continua visível."
              : "Escolhas alteradas. Recalcule para atualizar a grade; o resultado abaixo é do cálculo anterior."}
          </p>
          <Button size="sm" disabled={calculating} onClick={onRecalculate}>
            {calculating ? "Recalculando…" : "Recalcular combinações"}
          </Button>
        </div>
      )}
      {Boolean(result.blockingChoices?.length) && (
        <div role="alert" className="rounded-lg border border-amber-300 p-3 space-y-3">
          <h3 className="text-sm font-medium">
            Revise estas turmas fixadas ou disciplinas exigidas
          </h3>
          <ul className="space-y-3">
            {result.blockingChoices?.map(item => {
              const active =
                item.kind === "fixed"
                  ? Boolean(item.offerId && fixedOfferIds.includes(item.offerId))
                  : requiredCodes.includes(item.code);
              return (
                <li key={`${item.kind}:${item.offerId ?? item.code}`} className="space-y-1 text-sm">
                  <p className="font-medium">
                    {item.name} · {item.code}
                    {item.section ? ` · Turma ${item.section}` : ""}
                  </p>
                  {item.reasons.map(reason => (
                    <p key={reason} className="text-xs text-muted-foreground">
                      {reason}
                    </p>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!active || calculating}
                    onClick={() => {
                      if (item.kind === "fixed" && item.offerId) {
                        onUnfix(item.offerId);
                      } else {
                        onUnrequire(item.code);
                      }
                    }}
                  >
                    {active
                      ? item.kind === "fixed"
                        ? "Desfixar turma"
                        : "Retirar exigência"
                      : "Removida · recalcule"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {result.solutions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Escolha uma combinação">
          {result.solutions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === index}
              className={`min-w-0 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:p-4 ${selected === index ? "border-primary bg-primary/5 ring-1 ring-primary/15" : "bg-card hover:border-primary/40 hover:bg-muted/30"}`}
              onClick={() => {
                setSelected(index);
                setActiveClass(null);
              }}
            >
              <span className="mb-2 flex items-center justify-between gap-1 text-xs font-semibold sm:text-sm">
                Opção {String.fromCharCode(65 + index)}
                {selected === index && (
                  <Check size={14} className="shrink-0" aria-label="Selecionada" />
                )}
              </span>
              <span className="block text-xl font-semibold tabular-nums sm:text-2xl">
                {item.workload}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">h</span>
              </span>
              <span className="mt-1 block text-[10px] text-muted-foreground sm:text-xs">
                {item.selections.length}{" "}
                {item.selections.length === 1 ? "disciplina" : "disciplinas"} · {item.days}{" "}
                {item.days === 1 ? "dia" : "dias"}
              </span>
              <span className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs">
                <Clock3 size={11} className="hidden shrink-0 sm:block" />
                {item.gapMinutes ? `${item.gapMinutes} min de janelas` : "Sem janelas"}
              </span>
              {item.progress && item.progress.strategy !== "balanced" && (
                <span className="mt-2 block break-words text-[10px] text-muted-foreground sm:text-xs">
                  {item.progress.strategy === "target"
                    ? `Alvo: ${item.progress.target?.name ?? "a escolher"}`
                    : `${item.progress.unlocked.length} pré-requisitos liberados`}
                </span>
              )}
              {item.conditional.length > 0 && (
                <span className="mt-2 block text-[10px] text-amber-800 dark:text-amber-400 sm:text-xs">
                  {item.conditional.length} a conferir
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {solution && (
        <div className="space-y-4 rounded-xl border bg-card p-3 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} />
                Sua grade · Opção {String.fromCharCode(65 + selected)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Clique na aula para ver dependências ou ajustar a turma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={calculating}
                onClick={() => onFix(solution.selections.map(item => item.offer.id))}
              >
                <Pin size={13} />
                Fixar esta grade
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={exporting}
                onClick={exportImage}
                aria-label="Baixar grade como imagem"
              >
                <Download size={13} />
                {exporting ? "Gerando…" : "Baixar imagem"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Horário de Recife</p>
          <Popover
            open={Boolean(activeOffer)}
            onOpenChange={open => {
              if (!open) {
                setActiveClass(null);
              }
            }}
          >
            <Anchor virtualRef={anchorRef} />
            <div className="hidden md:block">
              <CalendarGridTable
                classes={classes}
                classColors={colors}
                isDark={isDark}
                onCellClick={openClassActions}
              />
            </div>
            <div className="md:hidden">
              <CalendarMobileView
                classes={classes}
                classColors={colors}
                isDark={isDark}
                onCellClick={openClassActions}
              />
            </div>
            {activeOffer && (
              <PopoverContent
                side="bottom"
                align="center"
                sideOffset={8}
                collisionPadding={12}
                className="w-80 max-w-[calc(100vw-24px)] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto rounded-xl p-3"
                aria-label="Ações da turma"
                onCloseAutoFocus={event => {
                  event.preventDefault();
                  anchorRef.current?.focus();
                }}
              >
                <Arrow className="fill-popover" width={14} height={7} />
                <div className="mb-3 pr-7">
                  <p className="text-sm font-semibold leading-snug">{activeOffer.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeOffer.code} · Turma {activeOffer.section}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 size-7"
                  aria-label="Fechar ações da turma"
                  onClick={() => setActiveClass(null)}
                >
                  <X size={14} />
                </Button>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    disabled={calculating}
                    onClick={() => onToggleFix(activeOffer.id)}
                  >
                    <Pin size={15} />
                    {fixedOfferIds.includes(activeOffer.id) ? "Desfixar turma" : "Fixar turma"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    disabled={calculating || excludedOfferIds.includes(activeOffer.id)}
                    onClick={() => onExclude(activeOffer.id)}
                  >
                    <Ban size={15} />
                    {excludedOfferIds.includes(activeOffer.id)
                      ? "Turma excluída"
                      : "Não usar esta turma"}
                  </Button>
                </div>
                {activeImpact && <DisciplineImpactDetails impact={activeImpact} />}
                <div className="mt-2 border-t pt-2">
                  {needsRecalculation ? (
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={calculating}
                      onClick={() => {
                        setActiveClass(null);
                        onRecalculate();
                      }}
                    >
                      Recalcular combinações
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Vale para o próximo cálculo.</p>
                  )}
                </div>
              </PopoverContent>
            )}
          </Popover>
          {solution.progress &&
            (solution.progress.strategy !== "balanced" ||
              solution.progress.unlocked.length > 0) && (
              <div
                className="space-y-2 rounded-lg border bg-primary/5 p-3"
                aria-label="Plano de progresso desta opção"
              >
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Route size={16} />
                  {solution.progress.strategy === "target" && solution.progress.target
                    ? `Caminho para ${solution.progress.target.name}`
                    : "Progresso no currículo"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Após aprovação nas disciplinas desta opção. Oferta futura, correquisitos e
                  matrícula precisam ser conferidos.
                </p>
                {solution.progress.paths.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {solution.progress.paths.map(route => (
                      <li key={route.map(item => item.code).join(":")} className="break-words">
                        {route.map(item => `${item.name} (${item.code})`).join(" → ")}
                      </li>
                    ))}
                  </ul>
                )}
                {solution.progress.strategy === "target" &&
                  solution.progress.paths.length === 0 &&
                  solution.progress.warnings.length === 0 && (
                    <p className="text-sm">
                      Esta opção não inclui etapas do caminho do alvo. Confira a oferta, os filtros
                      e as prioridades manuais.
                    </p>
                  )}
                {solution.progress.unlocked.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-sm">
                      Pré-requisitos atendidos após aprovação ({solution.progress.unlocked.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs">
                      {solution.progress.unlocked.map(item => (
                        <li key={item.code}>
                          {item.name} · {item.code}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {solution.progress.strategy === "target" &&
                  solution.progress.remaining.length > 0 && (
                    <details>
                      <summary className="cursor-pointer text-sm">
                        Etapas de pré-requisitos ainda pendentes (
                        {solution.progress.remaining.length})
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs">
                        {solution.progress.remaining.map(item => (
                          <li key={item.code}>
                            {item.name} · {item.code}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Em regras OU, mostra uma alternativa com menos pendências conhecidas; não é
                        previsão de semestres.
                      </p>
                    </details>
                  )}
                {solution.progress.warnings.map(warning => (
                  <p key={warning} className="text-xs text-amber-700 dark:text-amber-400">
                    {warning}
                  </p>
                ))}
              </div>
            )}

          <details>
            <summary className="cursor-pointer text-sm">
              Disciplinas, turmas e salas ({solution.selections.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm">
              {solution.selections.map(item => (
                <li key={item.goal.code}>
                  <strong>{item.offer.name}</strong> · {item.offer.code} · Turma{" "}
                  {item.offer.section} · {formatHorario(item.offer.schedule)} ·{" "}
                  {item.offer.location ?? "Local a verificar"}
                </li>
              ))}
            </ul>
          </details>
          {solution.conditional.length > 0 && (
            <div className="rounded-md border border-amber-300 p-3">
              <h3 className="font-medium text-sm">A conferir nesta opção</h3>
              <ul className="list-disc pl-5 text-sm">
                {solution.conditional.map(text => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Motivos que eliminaram turmas
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {solution
            ? `Inclui as disciplinas fora da opção ${String.fromCharCode(65 + selected)} e as turmas descartadas. Uma disciplina pode ter outra turma incluída na grade.`
            : "Turmas descartadas pelos filtros e requisitos desta simulação."}
        </p>
        {groupedExclusions.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma exclusão registrada.</p>
        )}
        <ul className="mt-3 space-y-2 text-sm">
          {groupedExclusions.map(({ reason, items }) => (
            <li key={reason}>
              <details>
                <summary className="cursor-pointer">
                  {reason} ({items.length})
                </summary>
                {reason === "Nenhuma turma localizada nas ofertas consultadas" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Isso não comprova ausência de oferta no SIGAA; a consulta pode estar incompleta.
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {items.map(item => (
                    <li key={item.code}>
                      <span>
                        {item.name} · {item.code}
                      </span>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground">Requer: {item.detail}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
