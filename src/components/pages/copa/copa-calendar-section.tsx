"use client";

import { ArrowRight, CalendarDays, ChevronDown, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/client/utils";
import { COPA_MATCHES_CHRONO } from "@/lib/shared/copa/matches";
import {
  formatKickoffDate,
  formatKickoffWeekday,
  groupMatchesByDay,
} from "@/lib/shared/copa/utils";
import { MatchCard } from "./match-card";

/**
 * Seção da Copa do Mundo exibida na página de horários (/calendario).
 * Mostra os jogos da Copa nos dias específicos, com a opção de adicionar
 * cada partida ao Google Agenda — assim como as turmas.
 */
export function CopaCalendarSection() {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const visibleMatches = useMemo(() => {
    if (showAll || now === null) {
      return COPA_MATCHES_CHRONO;
    }
    const upcoming = COPA_MATCHES_CHRONO.filter(match => new Date(match.kickoff).getTime() >= now);
    // Se a Copa já acabou, cai de volta para a lista completa.
    return upcoming.length > 0 ? upcoming : COPA_MATCHES_CHRONO;
  }, [showAll, now]);

  const matchesByDay = useMemo(() => groupMatchesByDay(visibleMatches), [visibleMatches]);

  return (
    <section className="mt-10 rounded-3xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          className="flex items-center gap-3 text-left focus-visible:outline-none"
          aria-expanded={open}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
            <Trophy className="h-5 w-5" />
          </span>
          <span>
            <span className="flex items-center gap-2 font-display text-xl font-bold text-aquario-header dark:text-aquario-header-dark">
              Jogos da Copa do Mundo 2026
              <ChevronDown
                className={cn("h-5 w-5 transition-transform", open ? "rotate-180" : "")}
              />
            </span>
            <span className="text-sm text-muted-foreground">
              Adicione as partidas ao seu Google Agenda, junto com as turmas.
            </span>
          </span>
        </button>

        <Link
          href="/copa-do-mundo"
          className="inline-flex items-center gap-1.5 rounded-full bg-aquario-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-aquario-primary/90"
        >
          Ver tabela completa
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {open && (
        <div className="mt-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                !showAll
                  ? "bg-aquario-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
              )}
            >
              Próximos jogos
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                showAll
                  ? "bg-aquario-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
              )}
            >
              Todos os jogos
            </button>
          </div>

          <div className="max-h-[32rem] space-y-6 overflow-y-auto pr-1">
            {matchesByDay.map(day => (
              <div key={day.dayKey}>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-aquario-primary dark:text-sky-200" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-aquario-header dark:text-aquario-header-dark">
                    {formatKickoffWeekday(day.iso)}, {formatKickoffDate(day.iso)}
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {day.matches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
