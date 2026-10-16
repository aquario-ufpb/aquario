"use client";
import { useRef } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { TimeWindow } from "@/lib/shared/planner/types";
import { TIME_SLOTS_BY_PERIOD, PERIOD_NAMES } from "@/lib/shared/calendario/constants";
import { fitsAvailability, timeLabel } from "@/lib/shared/planner/solver";
import { paintAvailability } from "@/lib/shared/planner/availability";

export const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const selectClass = "h-10 rounded-md border bg-background px-3 text-sm w-full min-w-0";
const days = dayNames.map((name, i) => ({ name, code: i + 2, day: i + 1 }));
const periods = ["M", "T", "N"] as const;
const minute = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export function AvailabilityEditor({
  windows,
  onChange,
  mode = "blocked",
}: {
  windows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
  mode?: "blocked" | "available";
}) {
  const painting = useRef<TimeWindow["kind"] | null>(null);
  const consumedClick = useRef(false);
  const current = useRef(windows);
  current.current = windows;
  const paint = (day: number, start: number, end: number, kind: TimeWindow["kind"]) => {
    const next = paintAvailability(current.current, { day, start, end, kind });
    if (next.length <= 224) {
      current.current = next;
      onChange(next);
    }
  };
  const fillPeriod = (period: (typeof periods)[number], action: "available" | "unavailable") => {
    if (!action) {
      return;
    }
    const slots = TIME_SLOTS_BY_PERIOD[period];
    let next = current.current;
    for (const { day } of days) {
      const block = {
        day,
        start: minute(slots[0].start),
        end: minute(slots[slots.length - 1].end),
      };
      next = paintAvailability(next, { ...block, kind: action });
    }
    if (next.length <= 224) {
      current.current = next;
      onChange(next);
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            Livre
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500" />
            Bloqueado
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={!windows.length}
          onClick={() => onChange([])}
          className="h-8 gap-1.5 px-2 text-xs"
        >
          <RotateCcw size={13} />
          Restaurar semana
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Clique ou arraste nos horários. Clique no dia para alternar esse dia no turno. ✓ e × alteram
        o turno em todos os dias.
      </p>
      <TooltipProvider delayDuration={200}>
        <table
          className="w-full table-fixed border-separate border-spacing-0.5 rounded-xl border bg-muted/15 p-1.5 text-xs"
          onPointerUp={() => {
            painting.current = null;
          }}
          onPointerLeave={() => {
            painting.current = null;
          }}
        >
          <caption className="sr-only">
            Disponibilidade semanal. Verde disponível, vermelho indisponível.
          </caption>
          <colgroup>
            <col className="w-[76px] sm:w-[88px]" />
            <col span={6} />
          </colgroup>
          {periods.map((period, periodIndex) => (
            <tbody key={period}>
              {periodIndex > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={7} className="h-2" />
                </tr>
              )}
              <tr>
                <th
                  colSpan={7}
                  scope="rowgroup"
                  className="rounded-lg bg-muted/70 px-2 py-1 text-left font-medium"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-background text-[10px] text-muted-foreground">
                        {period}
                      </span>
                      <span>{PERIOD_NAMES[period]}</span>
                      <span className="hidden text-[10px] font-normal text-muted-foreground sm:inline">
                        {TIME_SLOTS_BY_PERIOD[period][0].start}–
                        {TIME_SLOTS_BY_PERIOD[period][TIME_SLOTS_BY_PERIOD[period].length - 1].end}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {(["available", "unavailable"] as const).map(kind => (
                        <Tooltip key={kind}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={`inline-flex size-8 items-center justify-center rounded-md border bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${kind === "available" ? "text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400" : "text-red-700 hover:bg-red-100 dark:text-red-400"}`}
                              aria-label={`${kind === "available" ? "Liberar" : "Bloquear"} ${PERIOD_NAMES[period].toLowerCase()} inteira`}
                              onClick={() => fillPeriod(period, kind)}
                            >
                              {kind === "available" ? <Check size={15} /> : <X size={15} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {kind === "available" ? "Liberar" : "Bloquear"}{" "}
                            {PERIOD_NAMES[period].toLowerCase()} inteira
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  scope="col"
                  className="pr-1 py-1 text-right text-[9px] font-normal text-muted-foreground"
                >
                  Horário
                </th>
                {days.map(({ name, code, day }) => {
                  const slots = TIME_SLOTS_BY_PERIOD[period];
                  const start = minute(slots[0].start),
                    end = minute(slots[slots.length - 1].end);
                  const free = fitsAvailability({ day, start, end }, windows, mode);
                  const mixed =
                    !free &&
                    slots.some(slot =>
                      fitsAvailability(
                        { day, start: minute(slot.start), end: minute(slot.end) },
                        windows,
                        mode
                      )
                    );
                  const action = `${free ? "Bloquear" : "Liberar"} ${name.toLowerCase()} no turno da ${PERIOD_NAMES[period].toLowerCase()}`;
                  return (
                    <th scope="col" key={day} className="py-1 font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={action}
                            aria-pressed={mixed ? "mixed" : !free}
                            className={`flex min-h-9 w-full flex-col items-center justify-center rounded-md border border-transparent text-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:text-xs ${free ? "text-emerald-800 hover:border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300" : mixed ? "text-amber-800 hover:border-amber-200 hover:bg-amber-100 dark:text-amber-300" : "text-red-800 hover:border-red-200 hover:bg-red-100 dark:text-red-300"}`}
                            onClick={() =>
                              paint(day, start, end, free ? "unavailable" : "available")
                            }
                          >
                            <span className="text-[9px] font-normal text-muted-foreground">
                              {code}
                            </span>
                            {name.slice(0, 3)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{action}</TooltipContent>
                      </Tooltip>
                    </th>
                  );
                })}
              </tr>
              {TIME_SLOTS_BY_PERIOD[period].map((slot, index) => {
                const start = minute(slot.start),
                  end = minute(slot.end);
                return (
                  <tr key={`${period}${index}`}>
                    <th
                      scope="row"
                      className="whitespace-nowrap py-0.5 pr-1 text-right font-normal text-muted-foreground"
                    >
                      <span className="mr-1 text-[8px] opacity-60">{index + 1}</span>
                      <span className="text-[9px] sm:text-[10px]">
                        {slot.start}–{slot.end}
                      </span>
                    </th>
                    {days.map(({ name: day, day: dayNumber }) => {
                      const free = fitsAvailability({ day: dayNumber, start, end }, windows, mode);
                      return (
                        <td key={day}>
                          <button
                            type="button"
                            aria-label={`${day} ${timeLabel(start)}–${timeLabel(end)}: ${free ? "disponível" : "indisponível"}`}
                            aria-pressed={!free}
                            className={`group flex h-7 w-full items-center justify-center rounded border text-xs transition-colors sm:h-[30px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${free ? "bg-emerald-100/80 border-emerald-200 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300" : "bg-red-100/80 border-red-200 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-300"}`}
                            onPointerDown={e => {
                              if (e.button !== 0 || e.pointerType !== "mouse") {
                                return;
                              }
                              consumedClick.current = true;
                              painting.current = free ? "unavailable" : "available";
                              paint(dayNumber, start, end, painting.current);
                            }}
                            onPointerEnter={e => {
                              if (e.buttons === 1 && painting.current) {
                                paint(dayNumber, start, end, painting.current);
                              } else {
                                painting.current = null;
                              }
                            }}
                            onClick={e => {
                              if (e.detail === 0 || !consumedClick.current) {
                                paint(dayNumber, start, end, free ? "unavailable" : "available");
                              }
                              painting.current = null;
                              consumedClick.current = false;
                            }}
                          >
                            {free ? (
                              <Check
                                size={11}
                                className="opacity-40 group-hover:opacity-100"
                                aria-hidden="true"
                              />
                            ) : (
                              <X size={12} aria-hidden="true" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </TooltipProvider>
      {mode === "available" && (
        <p className="text-xs text-muted-foreground">A busca usa somente os blocos verdes.</p>
      )}
    </div>
  );
}
