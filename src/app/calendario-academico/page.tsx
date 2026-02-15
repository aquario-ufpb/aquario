"use client";

import { useState, useMemo, useRef, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { List, CalendarDays, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import {
  useSemestres,
  useSemestre,
  useSemestreAtivo,
} from "@/lib/client/hooks/use-calendario-academico";
import {
  CATEGORIA_LABELS,
  CATEGORIA_COLORS,
  ALL_CATEGORIAS,
} from "@/lib/shared/config/calendario-academico";
import type { CategoriaEvento, EventoCalendario } from "@/lib/shared/types/calendario.types";

// =============================================================================
// Helpers
// =============================================================================

function getCategoriaBadgeClasses(color: string): string {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rose: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
    slate: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  };
  return map[color] || map.slate;
}

function getCategoriaBarClasses(color: string): string {
  const map: Record<string, string> = {
    blue: "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100",
    indigo: "bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100",
    violet: "bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100",
    purple: "bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100",
    amber: "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100",
    red: "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100",
    orange: "bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100",
    yellow: "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100",
    emerald: "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100",
    green: "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100",
    rose: "bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100",
    slate: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100",
  };
  return map[color] || map.slate;
}

function formatDateRange(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" };

  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString("pt-BR", opts);
  }
  return `${start.toLocaleDateString("pt-BR", opts)} - ${end.toLocaleDateString("pt-BR", opts)}`;
}

function getMonthName(month: number): string {
  const names = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return names[month];
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
}

// =============================================================================
// Main Page
// =============================================================================

export default function CalendarioAcademicoPage() {
  const { data: semestres, isLoading: semestresLoading } = useSemestres();
  const { data: semestreAtivo } = useSemestreAtivo();
  const [selectedSemestreId, setSelectedSemestreId] = useState<string>("");
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [activeCategory, setActiveCategory] = useState<CategoriaEvento | null>(null);
  const [todayKey, setTodayKey] = useState(0);

  // Auto-select active semester when loaded
  const effectiveSemestreId = selectedSemestreId || semestreAtivo?.id || semestres?.[0]?.id || "";

  const { data: semestre, isLoading: semestreLoading } = useSemestre(effectiveSemestreId);

  const filteredEventos = useMemo(() => {
    if (!semestre?.eventos) {
      return [];
    }
    if (activeCategory === null) {
      return semestre.eventos;
    }
    return semestre.eventos.filter(e => e.categoria === activeCategory);
  }, [semestre?.eventos, activeCategory]);

  // Get which categories exist in the current semester's events
  const presentCategories = useMemo(() => {
    if (!semestre?.eventos) {
      return new Set<CategoriaEvento>();
    }
    return new Set(semestre.eventos.map(e => e.categoria));
  }, [semestre?.eventos]);

  const handleCategoryClick = (cat: CategoriaEvento) => {
    setActiveCategory(prev => (prev === cat ? null : cat));
  };

  const isLoading = semestresLoading || semestreLoading;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-[#0e3a6c] dark:text-[#C8E6FA]">
          Calendário Acadêmico
        </h1>
        <p className="text-lg text-[#0e3a6c] dark:text-[#E5F6FF]">
          Visualize os eventos e datas importantes do calendário acadêmico da UFPB
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {semestresLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <Select value={effectiveSemestreId} onValueChange={setSelectedSemestreId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione o semestre" />
            </SelectTrigger>
            <SelectContent>
              {semestres?.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    {s.nome}
                    {semestreAtivo?.id === s.id && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Atual
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex rounded-lg border overflow-hidden">
          <Button
            variant={view === "lista" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("lista")}
          >
            <List className="w-4 h-4 mr-2" />
            Linha do tempo
          </Button>
          <Button
            variant={view === "calendario" ? "default" : "ghost"}
            size="sm"
            className="rounded-none"
            onClick={() => setView("calendario")}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendário
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={() => setTodayKey(k => k + 1)}>
          <Circle className="w-2 h-2 mr-2 fill-current" />
          Hoje
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_CATEGORIAS.filter(cat => presentCategories.has(cat)).map(cat => {
          const isActive = activeCategory === null || activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-opacity cursor-pointer ${getCategoriaBadgeClasses(CATEGORIA_COLORS[cat])} ${isActive ? "opacity-100" : "opacity-30"}`}
            >
              {CATEGORIA_LABELS[cat]}
            </button>
          );
        })}
        {activeCategory !== null && (
          <button
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Mostrar todos
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !semestre || !filteredEventos.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {!semestre
              ? "Nenhum semestre disponível."
              : "Nenhum evento encontrado para os filtros selecionados."}
          </CardContent>
        </Card>
      ) : view === "lista" ? (
        <TimelineView key={todayKey} eventos={filteredEventos} allEventos={semestre.eventos} />
      ) : (
        <CalendarGridView
          key={todayKey}
          eventos={filteredEventos}
          dataInicio={semestre.dataInicio}
          dataFim={semestre.dataFim}
        />
      )}
    </div>
  );
}

// =============================================================================
// Timeline View (scrollable, auto-focuses on today)
// =============================================================================

function TimelineView({
  eventos,
  allEventos,
}: {
  eventos: EventoCalendario[];
  allEventos: EventoCalendario[];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayMarkerRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const todayMonthKey = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, "0")}`;

  // Auto-scroll to today marker
  useEffect(() => {
    if (todayMarkerRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = todayMarkerRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop - container.clientHeight / 3;
      container.scrollTop += offset;
    }
  }, [allEventos]);

  // Group events by month, and determine where "today" marker goes
  const grouped = useMemo(() => {
    const groups: Record<string, EventoCalendario[]> = {};
    for (const evento of eventos) {
      const date = new Date(evento.dataInicio);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(evento);
    }

    // Ensure today's month exists in groups even if there are no events
    if (!groups[todayMonthKey]) {
      groups[todayMonthKey] = [];
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [eventos, todayMonthKey]);

  // Find the position of today within a month's events
  const getTodayInsertIndex = useCallback(
    (monthEvents: EventoCalendario[]) => {
      const todayTime = today.getTime();
      for (let i = 0; i < monthEvents.length; i++) {
        if (new Date(monthEvents[i].dataInicio).getTime() > todayTime) {
          return i;
        }
      }
      return monthEvents.length;
    },
    [today]
  );

  const todayLabel = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <Card className="overflow-hidden">
      <div ref={scrollContainerRef} className="max-h-[70vh] overflow-y-auto">
        {grouped.map(([monthKey, monthEvents], groupIndex) => {
          const [year, month] = monthKey.split("-").map(Number);
          const isCurrentMonth = monthKey === todayMonthKey;
          const todayInsertIdx = isCurrentMonth ? getTodayInsertIndex(monthEvents) : -1;

          return (
            <div key={monthKey}>
              <div className="sticky top-0 z-10 bg-card border-b px-4 md:px-6 py-2">
                <h3 className="text-lg font-semibold text-[#0e3a6c] dark:text-[#C8E6FA]">
                  {getMonthName(month)} {year}
                </h3>
              </div>
              <div
                className={`px-4 md:px-6 py-3 ${groupIndex === grouped.length - 1 ? "pb-6" : ""}`}
              >
                <div className="space-y-2 ml-4 border-l-2 border-muted pl-6">
                  {/* Today marker at start of month if before all events */}
                  {isCurrentMonth && todayInsertIdx === 0 && monthEvents.length > 0 && (
                    <TodayMarker ref={todayMarkerRef} label={todayLabel} />
                  )}

                  {monthEvents.map((evento, eventIdx) => {
                    const eventStart = new Date(evento.dataInicio);
                    const eventEnd = new Date(evento.dataFim);
                    const isActive = isDateInRange(today, eventStart, eventEnd);

                    return (
                      <div key={evento.id}>
                        <div
                          className={`relative flex items-start gap-4 p-3 rounded-lg transition-colors ${isActive ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                        >
                          <div
                            className={`absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2 border-background ${isActive ? "bg-primary" : "bg-muted-foreground"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{evento.descricao}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDateRange(evento.dataInicio, evento.dataFim)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 ${getCategoriaBadgeClasses(CATEGORIA_COLORS[evento.categoria])}`}
                              >
                                {CATEGORIA_LABELS[evento.categoria]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Today marker after this event if it belongs here */}
                        {isCurrentMonth && todayInsertIdx === eventIdx + 1 && (
                          <TodayMarker ref={todayMarkerRef} label={todayLabel} />
                        )}
                      </div>
                    );
                  })}

                  {/* Today marker for empty month (no events this month) */}
                  {isCurrentMonth && monthEvents.length === 0 && (
                    <TodayMarker ref={todayMarkerRef} label={todayLabel} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// =============================================================================
// Today Marker
// =============================================================================

const TodayMarker = forwardRef<HTMLDivElement, { label: string }>(({ label }, ref) => (
  <div ref={ref} className="relative flex items-center gap-3 py-2">
    <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary ring-2 ring-primary/30" />
    <div className="h-px flex-1 bg-primary/40" />
    <span className="text-xs font-semibold text-primary whitespace-nowrap">
      Hoje &mdash; {label}
    </span>
    <div className="h-px flex-1 bg-primary/40" />
  </div>
));
TodayMarker.displayName = "TodayMarker";

// =============================================================================
// Calendar Grid View (single month, detailed days)
// =============================================================================

function CalendarGridView({
  eventos,
  dataInicio,
  dataFim,
}: {
  eventos: EventoCalendario[];
  dataInicio: string;
  dataFim: string;
}) {
  const today = useMemo(() => new Date(), []);

  // Generate all months between start and end of events (use full event range)
  const months = useMemo(() => {
    const allDates = eventos.flatMap(e => [new Date(e.dataInicio), new Date(e.dataFim)]);
    const startDate =
      allDates.length > 0
        ? new Date(Math.min(new Date(dataInicio).getTime(), ...allDates.map(d => d.getTime())))
        : new Date(dataInicio);
    const endDate =
      allDates.length > 0
        ? new Date(Math.max(new Date(dataFim).getTime(), ...allDates.map(d => d.getTime())))
        : new Date(dataFim);

    const result: { year: number; month: number }[] = [];
    const endMonthValue = endDate.getFullYear() * 12 + endDate.getMonth();
    let y = startDate.getFullYear();
    let m = startDate.getMonth();

    while (y * 12 + m <= endMonthValue) {
      result.push({ year: y, month: m });
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }

    return result;
  }, [dataInicio, dataFim, eventos]);

  // Find index of today's month, or closest month
  const todayMonthIndex = useMemo(() => {
    const todayMonth = today.getFullYear() * 12 + today.getMonth();

    for (let i = 0; i < months.length; i++) {
      const m = months[i].year * 12 + months[i].month;
      if (m === todayMonth) {
        return i;
      }
      if (m > todayMonth) {
        return Math.max(0, i - 1);
      }
    }
    return months.length - 1;
  }, [months, today]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(todayMonthIndex);

  const currentMonth = months[currentMonthIndex];

  const goToPrev = useCallback(() => {
    setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentMonthIndex(prev => Math.min(months.length - 1, prev + 1));
  }, [months.length]);

  if (!currentMonth) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" disabled={currentMonthIndex === 0} onClick={goToPrev}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>
        <h3 className="text-lg font-semibold text-[#0e3a6c] dark:text-[#C8E6FA]">
          {getMonthName(currentMonth.month)} {currentMonth.year}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentMonthIndex >= months.length - 1}
          onClick={goToNext}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <DetailedMonthGrid year={currentMonth.year} month={currentMonth.month} eventos={eventos} />
    </div>
  );
}

// =============================================================================
// Day Detail Dialog
// =============================================================================

function DayDetailDialog({
  date,
  events,
  open,
  onClose,
}: {
  date: Date;
  events: EventoCalendario[];
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {date.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {events.map(evento => {
            const eventStart = new Date(evento.dataInicio);
            const eventEnd = new Date(evento.dataFim);
            const isStart = isSameDay(date, eventStart);
            const isEnd = isSameDay(date, eventEnd);
            const isSingle = isStart && isEnd;
            const color = CATEGORIA_COLORS[evento.categoria];

            return (
              <div key={evento.id} className={`rounded-lg p-3 ${getCategoriaBarClasses(color)}`}>
                <p className="font-medium text-sm">{evento.descricao}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-80">
                    {formatDateRange(evento.dataInicio, evento.dataFim)}
                  </span>
                  {!isSingle && (
                    <span className="text-xs font-medium opacity-70">
                      {isStart ? "(Início)" : isEnd ? "(Fim)" : "(Em andamento)"}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-2 ${getCategoriaBadgeClasses(color)}`}
                >
                  {CATEGORIA_LABELS[evento.categoria]}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Detailed Month Grid
// =============================================================================

function DetailedMonthGrid({
  year,
  month,
  eventos,
}: {
  year: number;
  month: number;
  eventos: EventoCalendario[];
}) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    events: EventoCalendario[];
  } | null>(null);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <>
      <Card>
        <CardContent className="p-2 md:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map(d => (
              <div key={d} className="text-xs text-muted-foreground font-medium py-2 text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const date = new Date(year, month, day);
              const isDayToday = isSameDay(date, today);
              const dayEvents = eventos.filter(e =>
                isDateInRange(date, new Date(e.dataInicio), new Date(e.dataFim))
              );
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDay({ date, events: dayEvents });
                    }
                  }}
                  className={`aspect-square rounded-lg border p-1 md:p-1.5 transition-colors text-left flex flex-col overflow-hidden ${
                    isDayToday
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : hasEvents
                        ? "border-border bg-card hover:bg-muted/30 cursor-pointer"
                        : isWeekend
                          ? "border-transparent bg-muted/20"
                          : "border-transparent"
                  }`}
                  disabled={!hasEvents}
                >
                  {/* Day number */}
                  <div
                    className={`text-sm font-medium mb-0.5 shrink-0 ${
                      isDayToday
                        ? "text-primary font-bold"
                        : hasEvents
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {day}
                    {isDayToday && (
                      <span className="ml-1 text-xs font-normal text-primary">hoje</span>
                    )}
                  </div>

                  {/* Event bars */}
                  <div className="space-y-1 overflow-hidden flex-1 min-h-0">
                    {dayEvents.slice(0, 3).map(evento => {
                      const eventStart = new Date(evento.dataInicio);
                      const eventEnd = new Date(evento.dataFim);
                      const isStart = isSameDay(date, eventStart);
                      const isEnd = isSameDay(date, eventEnd);
                      const isSingle = isStart && isEnd;
                      const color = CATEGORIA_COLORS[evento.categoria];

                      return (
                        <div
                          key={evento.id}
                          className={`text-xs leading-tight px-1 py-0.5 truncate ${getCategoriaBarClasses(color)} ${
                            isSingle ? "rounded" : isStart ? "rounded-l" : isEnd ? "rounded-r" : ""
                          }`}
                        >
                          {isStart || isSingle ? (
                            <span className="font-medium">
                              <span className="hidden md:inline">{evento.descricao}</span>
                              <span className="md:hidden">
                                {CATEGORIA_LABELS[evento.categoria]}
                              </span>
                            </span>
                          ) : isEnd ? (
                            <span className="hidden md:inline text-xs opacity-70">
                              fim: {evento.descricao}
                            </span>
                          ) : (
                            <span className="text-xs opacity-50">&nbsp;</span>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <DayDetailDialog
          date={selectedDay.date}
          events={selectedDay.events}
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}
