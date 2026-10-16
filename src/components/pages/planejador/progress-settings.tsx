"use client";
import { useState } from "react";
import { Check, ChevronsUpDown, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { PlannerGoal, PlannerSettings } from "@/lib/shared/planner/types";
import { selectClass } from "./availability-editor";

export function ProgressSettings({
  settings,
  goals,
  onChange,
}: {
  settings: PlannerSettings;
  goals: PlannerGoal[];
  onChange: (value: PlannerSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  const target = goals.find(goal => goal.code === settings.progressTarget);
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Route size={16} />
        Plano de progresso
      </p>
      <div>
        <Label htmlFor="progress-strategy">O que priorizar no currículo?</Label>
        <select
          id="progress-strategy"
          className={selectClass}
          value={settings.progressStrategy}
          onChange={e =>
            onChange({
              ...settings,
              progressStrategy: e.target.value as PlannerSettings["progressStrategy"],
            })
          }
        >
          <option value="balanced">Equilibrar disciplinas e horários</option>
          <option value="unlock">Abrir caminho no currículo</option>
          <option value="target">Chegar a uma disciplina alvo</option>
        </select>
      </div>
      {settings.progressStrategy === "target" && (
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                role="combobox"
                aria-label="Disciplina alvo do plano"
                aria-expanded={open}
                variant="outline"
                className="h-auto min-h-10 w-full justify-between gap-2 text-left font-normal"
              >
                <span className="min-w-0 break-words">
                  {target ? `${target.name} · ${target.code}` : "Buscar disciplina alvo…"}
                </span>
                <ChevronsUpDown size={16} className="shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0"
            >
              <Command>
                <CommandInput placeholder="Nome ou código da disciplina…" />
                <CommandList>
                  <CommandEmpty>Nenhuma disciplina pendente encontrada.</CommandEmpty>
                  <CommandGroup>
                    {goals
                      .filter(goal => !goal.completed && goal.priority !== "exclude")
                      .map(goal => (
                        <CommandItem
                          key={goal.code}
                          value={`${goal.name} ${goal.code}`}
                          onSelect={() => {
                            onChange({ ...settings, progressTarget: goal.code });
                            setOpen(false);
                          }}
                        >
                          <Check
                            size={15}
                            className={`mr-2 shrink-0 ${goal.code === settings.progressTarget ? "opacity-100" : "opacity-0"}`}
                          />
                          <span>
                            {goal.name}
                            <span className="block text-xs text-muted-foreground">{goal.code}</span>
                          </span>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {target?.completed && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              O alvo já está concluído ou considerado aprovado; escolha outra disciplina.
            </p>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {settings.progressStrategy === "target"
          ? "Favorece as cadeiras de agora que reduzem o caminho de pré-requisitos até o alvo."
          : settings.progressStrategy === "unlock"
            ? "Favorece pré-requisitos de disciplinas pendentes, considerando também as cadeias mais longas."
            : "O progresso pelo grafo aparece nas explicações, sem mudar a ordenação atual."}{" "}
        Suas prioridades manuais vêm primeiro. O plano supõe aprovação e não prevê ofertas de
        semestres futuros.
      </p>
    </div>
  );
}
