"use client";

import { Trophy, CalendarDays, MapPin, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/client/utils";
import { COPA_MATCHES, COPA_MATCHES_CHRONO } from "@/lib/shared/copa/matches";
import { COPA_GROUP_LETTERS, COPA_TEAMS } from "@/lib/shared/copa/teams";
import type { CopaMatch, CopaStage } from "@/lib/shared/copa/types";
import {
  formatKickoffDate,
  formatKickoffWeekday,
  groupMatchesByDay,
} from "@/lib/shared/copa/utils";
import { GroupCard } from "./group-card";
import { MatchCard } from "./match-card";

type StageFilter = "todos" | CopaStage;

const STAGE_FILTERS: Array<{ value: StageFilter; label: string }> = [
  { value: "todos", label: "Todos os jogos" },
  { value: "grupos", label: "Fase de grupos" },
  { value: "32avos", label: "Rodada de 32" },
  { value: "oitavas", label: "Oitavas" },
  { value: "quartas", label: "Quartas" },
  { value: "semis", label: "Semifinais" },
  { value: "final", label: "Final" },
];

function matchesStage(match: CopaMatch, filter: StageFilter): boolean {
  if (filter === "todos") {
    return true;
  }
  if (filter === "final") {
    // O filtro "Final" também inclui a disputa de 3º lugar.
    return match.stage === "final" || match.stage === "terceiro";
  }
  return match.stage === filter;
}

const SORTED_TEAMS = [...COPA_TEAMS].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function CopaClient() {
  const [stage, setStage] = useState<StageFilter>("todos");
  const [teamId, setTeamId] = useState<string>("");
  const [now, setNow] = useState<number | null>(null);

  // Evita divergência de hidratação: "agora" só é definido no cliente.
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const filteredMatches = useMemo(() => {
    return COPA_MATCHES.filter(match => {
      if (!matchesStage(match, stage)) {
        return false;
      }
      if (teamId && match.homeId !== teamId && match.awayId !== teamId) {
        return false;
      }
      return true;
    });
  }, [stage, teamId]);

  const matchesByDay = useMemo(() => groupMatchesByDay(filteredMatches), [filteredMatches]);

  const upcomingMatches = useMemo(() => {
    if (now === null) {
      return [];
    }
    return COPA_MATCHES_CHRONO.filter(match => new Date(match.kickoff).getTime() >= now).slice(
      0,
      3
    );
  }, [now]);

  return (
    <div className="container mx-auto mt-20 max-w-5xl overflow-x-hidden p-4 md:p-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-aquario-primary via-[#0e3a6c] to-sky-900 p-6 text-white shadow-lg md:p-10">
        <Bunting />
        <div className="relative mt-4">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-amber-400/20 p-3 ring-1 ring-amber-300/30">
            <Trophy className="h-8 w-8 text-amber-300" />
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Copa do Mundo 2026
          </h1>
          <p className="mt-3 max-w-2xl text-base text-sky-100 md:text-lg">
            Todos os jogos da Copa do Mundo FIFA — EUA, Canadá e México — com horários de Brasília e
            a opção de adicionar cada partida ao Google Agenda.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <HeroBadge icon={Users} text="48 seleções" />
            <HeroBadge icon={Trophy} text="104 jogos" />
            <HeroBadge icon={CalendarDays} text="11 jun – 19 jul" />
            <HeroBadge icon={MapPin} text="Horário de Brasília" />
          </div>
        </div>
      </section>

      {/* Próximos jogos */}
      {upcomingMatches.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-2xl font-bold text-aquario-header dark:text-aquario-header-dark">
            Próximos jogos
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Filtros + tabela */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold text-aquario-header dark:text-aquario-header-dark">
          Tabela de jogos
        </h2>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STAGE_FILTERS.map(filter => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStage(filter.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  stage === filter.value
                    ? "bg-aquario-primary text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <select
            value={teamId}
            onChange={event => setTeamId(event.target.value)}
            className="w-full min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-aquario-header shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/15 dark:bg-white/5 dark:text-aquario-header-dark sm:w-auto"
            aria-label="Filtrar por seleção"
          >
            <option value="">Todas as seleções</option>
            {SORTED_TEAMS.map(team => (
              <option key={team.id} value={team.id}>
                {team.nome}
              </option>
            ))}
          </select>
        </div>

        {matchesByDay.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted-foreground dark:border-white/15">
            Nenhum jogo encontrado para esse filtro.
          </p>
        ) : (
          <div className="space-y-8">
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
        )}
      </section>

      {/* Grupos */}
      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl font-bold text-aquario-header dark:text-aquario-header-dark">
          Grupos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COPA_GROUP_LETTERS.map(grupo => (
            <GroupCard key={grupo} grupo={grupo} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Horários no fuso de Brasília (UTC-3) e sujeitos a alterações pela FIFA. Datas e jogos da
        fase de mata-mata dependem dos resultados das fases anteriores.
      </p>
    </div>
  );
}

function HeroBadge({ icon: Icon, text }: { icon: typeof Trophy; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/15">
      <Icon className="h-4 w-4 text-amber-300" />
      {text}
    </span>
  );
}

// Bandeirinhas decorativas no topo do hero (ritmo de copa).
function Bunting() {
  const colors = [
    "#fbbf24",
    "#34d399",
    "#38bdf8",
    "#f87171",
    "#fbbf24",
    "#34d399",
    "#38bdf8",
    "#f87171",
    "#fbbf24",
    "#34d399",
    "#38bdf8",
    "#f87171",
  ];
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-2"
      aria-hidden="true"
    >
      {colors.map((color, i) => (
        <div
          key={i}
          className="h-4 w-5 opacity-80 md:h-5 md:w-6"
          style={{ backgroundColor: color, clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
      ))}
    </div>
  );
}
