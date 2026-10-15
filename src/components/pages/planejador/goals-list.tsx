"use client";
import { useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowUp, ArrowDown, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkRequirement, describeRequirement } from "@/lib/shared/planner/requirements";
import type { PlannerGoal } from "@/lib/shared/planner/types";

function PriorityRow({
  goal,
  index,
  count,
  onMove,
  onPriority,
}: {
  goal: PlannerGoal;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onPriority: (code: string, priority: PlannerGoal["priority"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: goal.code,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded-md border bg-background p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none rounded p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`Arrastar ${goal.name}`}
      >
        <GripVertical size={18} />
      </button>
      <span className="text-sm text-muted-foreground">{index + 1}.</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{goal.name}</p>
        <p className="text-xs text-muted-foreground">
          {goal.code} · {goal.workload ?? "?"}h
          {goal.unlocks > 0 ? ` · pré-requisito de ${goal.unlocks}` : ""}
        </p>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Opções</summary>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={goal.priority === "required"}
              onChange={e => onPriority(goal.code, e.target.checked ? "required" : "high")}
            />
            Exigir esta cadeira na combinação
          </label>
          <p>
            Pré-requisitos: {describeRequirement(goal.prerequisite)}
            {!goal.requirementsKnown ? " · A verificar" : ""}
          </p>
        </details>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          size="icon"
          className="size-8"
          variant="ghost"
          disabled={index === 0}
          aria-label={`Subir ${goal.name}`}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp size={14} />
        </Button>
        <Button
          size="icon"
          className="size-8"
          variant="ghost"
          disabled={index === count - 1}
          aria-label={`Descer ${goal.name}`}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown size={14} />
        </Button>
        <Button
          size="icon"
          className="size-8"
          variant="ghost"
          aria-label={`Remover prioridade ${goal.name}`}
          onClick={() => onPriority(goal.code, "optional")}
        >
          <X size={16} />
        </Button>
      </div>
    </li>
  );
}
export function GoalsList({
  goals,
  completedCodes,
  order,
  onOrder,
  onPriority,
}: {
  goals: PlannerGoal[];
  completedCodes: string[];
  order: string[];
  onOrder: (order: string[]) => void;
  onPriority: (code: string, priority: PlannerGoal["priority"]) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(5);
  const [showLevelZero, setShowLevelZero] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const pending = goals.filter(goal => !goal.completed);
  const selected = order.flatMap(code => {
    const goal = pending.find(item => item.code === code);
    return goal ? [goal] : [];
  });
  const unselected = pending.filter(goal => !order.includes(goal.code));
  const levelZeroCount = unselected.filter(goal => goal.period === 0).length;
  const visiblePending = unselected.filter(goal => showLevelZero || goal.period !== 0);
  const candidates = visiblePending.filter(goal =>
    `${goal.code} ${goal.name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );
  const recommendation = visiblePending
    .filter(
      goal =>
        goal.priority !== "exclude" &&
        goal.unlocks > 0 &&
        checkRequirement(goal.prerequisite, new Set(completedCodes)) === "met"
    )
    .sort((a, b) => b.unlocks - a.unlocks)[0];
  const move = (from: number, to: number) =>
    onOrder(
      arrayMove(
        selected.map(goal => goal.code),
        from,
        to
      )
    );
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      move(
        selected.findIndex(goal => goal.code === active.id),
        selected.findIndex(goal => goal.code === over.id)
      );
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Adicione e arraste por prioridade. As outras cadeiras entram se couberem.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
        <SortableContext
          items={selected.map(goal => goal.code)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-2" aria-label="Disciplinas em ordem de prioridade">
            {selected.map((goal, index) => (
              <PriorityRow
                key={goal.code}
                goal={goal}
                index={index}
                count={selected.length}
                onMove={move}
                onPriority={onPriority}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {selected.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Quer garantir suas preferidas? Adicione abaixo e arraste da maior para a menor prioridade.
        </p>
      )}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />{" "}
        <Input
          className="pl-9 pr-9"
          ref={searchRef}
          aria-label="Buscar disciplinas pendentes"
          placeholder={`Buscar entre ${visiblePending.length} disciplinas pendentes`}
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setLimit(5);
          }}
        />
        {search && (
          <button
            type="button"
            aria-label="Limpar busca de disciplinas"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch("");
              setLimit(5);
              searchRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {levelZeroCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showLevelZero}
            onChange={e => {
              setShowLevelZero(e.target.checked);
              setLimit(5);
            }}
          />
          Mostrar nível 0 ({levelZeroCount})
        </label>
      )}
      {goals.length > 0 && candidates.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {search
            ? "Nenhuma disciplina encontrada nos filtros atuais."
            : "Nenhuma outra disciplina nos filtros atuais."}
        </p>
      )}
      {recommendation && (
        <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
          <p className="min-w-0 flex-1 text-xs">
            <strong>
              Para avançar no curso: {recommendation.name} ({recommendation.code}).
            </strong>{" "}
            É pré-requisito listado de {recommendation.unlocks} disciplinas no currículo disponível.
            Outros requisitos também podem ser necessários.
          </p>
          <Button
            size="sm"
            variant="outline"
            aria-label={`Priorizar ${recommendation.name}`}
            onClick={() => onPriority(recommendation.code, "high")}
          >
            Priorizar
          </Button>
        </div>
      )}
      <ul className="divide-y">
        {candidates.slice(0, limit).map(goal => (
          <li key={goal.code} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{goal.name}</p>
              <p className="text-xs text-muted-foreground">
                {goal.code} · {goal.workload ?? "?"}h
                {goal.unlocks > 0 ? ` · pré-requisito de ${goal.unlocks}` : ""}
              </p>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Requisitos e opções</summary>
                <p>
                  Pré-requisitos: {describeRequirement(goal.prerequisite)} ·{" "}
                  {checkRequirement(goal.prerequisite, new Set(completedCodes)) === "unmet"
                    ? "Não atendidos"
                    : !goal.requirementsKnown
                      ? "A verificar"
                      : "Verificar na simulação"}
                </p>
                <p>Correquisitos: {describeRequirement(goal.corequisite)}</p>
                <label>
                  <input
                    type="checkbox"
                    checked={goal.priority === "exclude"}
                    onChange={e => onPriority(goal.code, e.target.checked ? "exclude" : "optional")}
                  />{" "}
                  Não incluir nesta busca
                </label>
              </details>
            </div>
            <Button
              size="sm"
              variant="outline"
              aria-label={`Priorizar ${goal.name}`}
              onClick={() => onPriority(goal.code, "high")}
            >
              Priorizar
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {candidates.length > limit && (
          <Button size="sm" variant="ghost" onClick={() => setLimit(value => value + 10)}>
            Mostrar mais
          </Button>
        )}
        {limit > 5 && candidates.length > 5 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setLimit(5);
              searchRef.current?.focus({ preventScroll: true });
              searchRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
            }}
          >
            Mostrar menos
          </Button>
        )}
      </div>
      {!goals.length && (
        <p className="text-sm">
          Conecte o SIGAA para carregar suas pendências ou adicione uma disciplina personalizada.
        </p>
      )}
    </div>
  );
}
