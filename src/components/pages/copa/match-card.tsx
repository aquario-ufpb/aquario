"use client";

import { CalendarPlus, MapPin } from "lucide-react";
import { cn } from "@/lib/client/utils";
import { getCopaTeam } from "@/lib/shared/copa/teams";
import type { CopaMatchWithResult } from "@/lib/shared/copa/types";
import {
  buildMatchGoogleCalendarUrl,
  formatKickoffTime,
  getMatchSideName,
  STAGE_SHORT_LABELS,
} from "@/lib/shared/copa/utils";
import { Flag } from "./flag";

type MatchSideProps = {
  id: string | null;
  label?: string;
  align: "start" | "end";
};

function MatchSide({ id, label, align }: MatchSideProps) {
  const team = getCopaTeam(id);
  const name = getMatchSideName(id, label);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 sm:gap-3",
        align === "end" ? "flex-row-reverse text-right" : "text-left"
      )}
    >
      {team ? (
        <Flag code={team.flagCode} name={team.nome} width={32} className="shrink-0" />
      ) : (
        <span
          className="flex h-6 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-xs font-bold text-slate-500 ring-1 ring-black/5 dark:bg-white/10 dark:text-slate-300"
          aria-hidden="true"
        >
          ?
        </span>
      )}
      <span
        className={cn(
          "truncate text-sm font-semibold sm:text-base",
          team
            ? "text-aquario-header dark:text-aquario-header-dark"
            : "text-slate-500 dark:text-slate-400"
        )}
      >
        {name}
      </span>
    </div>
  );
}

const STAGE_BADGE_CLASS =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

export function MatchCard({ match }: { match: CopaMatchWithResult }) {
  const isGroupStage = match.stage === "grupos";
  const gcalUrl = buildMatchGoogleCalendarUrl(match);
  const isFinished = match.matchStatus === "finished";
  const isLive = match.matchStatus === "live";
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const hasPenalties = match.penaltyHomeScore !== null && match.penaltyAwayScore !== null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-sky-300/40">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            STAGE_BADGE_CLASS,
            isGroupStage
              ? "bg-sky-100 text-aquario-primary dark:bg-sky-400/10 dark:text-sky-200"
              : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
          )}
        >
          {isGroupStage ? `Grupo ${match.grupo}` : STAGE_SHORT_LABELS[match.stage]}
        </span>
        <span className="truncate text-xs text-muted-foreground">Jogo {match.id}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <MatchSide id={match.homeId} label={match.homeLabel} align="end" />
        <div className="flex shrink-0 flex-col items-center px-1">
          {hasScore ? (
            <>
              <span
                className={cn(
                  "font-display text-lg font-bold tabular-nums sm:text-xl",
                  isLive
                    ? "text-green-600 dark:text-green-400"
                    : "text-aquario-header dark:text-aquario-header-dark"
                )}
              >
                {match.homeScore} – {match.awayScore}
              </span>
              {hasPenalties && (
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  pên. {match.penaltyHomeScore} – {match.penaltyAwayScore}
                </span>
              )}
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wide",
                  isLive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                )}
              >
                {isLive ? "ao vivo" : "encerrado"}
              </span>
            </>
          ) : (
            <>
              <span className="font-display text-lg font-bold tabular-nums text-aquario-header dark:text-aquario-header-dark sm:text-xl">
                {formatKickoffTime(match.kickoff)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Brasília
              </span>
            </>
          )}
        </div>
        <MatchSide id={match.awayId} label={match.awayLabel} align="start" />
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {match.venue} · {match.city}
          </span>
        </span>
        {!isFinished && (
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-aquario-primary transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/15 dark:text-sky-200 dark:hover:bg-white/10"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Google Agenda
          </a>
        )}
      </div>
    </div>
  );
}
