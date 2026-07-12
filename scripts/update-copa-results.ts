/**
 * Busca resultados da Copa do Mundo 2026 na football-data.org e escreve
 * content/copa-resultados/results.json com os placares das partidas encerradas.
 *
 * Uso: FOOTBALL_DATA_API_KEY=<key> tsx scripts/update-copa-results.ts
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { COPA_MATCHES } from "../src/lib/shared/copa/matches";
import { resolveMatchParticipants } from "../src/lib/shared/copa/standings";

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

if (!API_KEY) {
  console.error("❌ FOOTBALL_DATA_API_KEY não definida");
  process.exit(1);
}

// Alguns TLAs da football-data.org diferem dos nossos IDs internos.
// Adicionar entradas conforme necessário após a primeira execução.
const API_TLA_TO_INTERNAL: Record<string, string> = {
  URY: "URU",
};

function toInternalId(tla: string): string {
  return API_TLA_TO_INTERNAL[tla] ?? tla;
}

type MatchStatus = "scheduled" | "live" | "finished";

// Every value football-data.org documents for the match-level `status`
// field: https://docs.football-data.org/general/v4/lookup_tables.html
// EXTRA_TIME/PENALTY_SHOOTOUT were previously missing here, so a knockout
// match still playing extra time or a shootout fell through to the
// "scheduled" default below — hiding an in-progress match's live score and,
// worse, blocking downstream bracket resolution for matches that depend on
// its winner even well after it had actually finished.
const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  EXTRA_TIME: "live",
  PENALTY_SHOOTOUT: "live",
  FINISHED: "finished",
  AWARDED: "finished",
  SUSPENDED: "scheduled",
  POSTPONED: "scheduled",
  CANCELLED: "scheduled",
};

type ApiMatch = {
  utcDate: string;
  status: string;
  homeTeam: { tla: string };
  awayTeam: { tla: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    // When duration is PENALTY_SHOOTOUT, fullTime is regularTime + extraTime +
    // penalties SUMMED — not the actual match score. See:
    // https://docs.football-data.org/general/v4/overtime.html
    fullTime: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
};

const API_WINNER_TO_INTERNAL: Record<string, "home" | "away"> = {
  HOME_TEAM: "home",
  AWAY_TEAM: "away",
};

const TOURNAMENT_START = new Date("2026-06-11T00:00:00Z");
const TOURNAMENT_END = new Date("2026-07-20T00:00:00Z"); // exclusive: day after the final

async function main() {
  const now = new Date();
  if (now < TOURNAMENT_START || now >= TOURNAMENT_END) {
    console.log(
      " Fora do período da Copa do Mundo 2026 (11 jun – 19 jul). Nenhuma atualização necessária."
    );
    process.exit(0);
  }

  console.log("Buscando resultados da Copa do Mundo 2026...");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": API_KEY as string },
      signal: controller.signal,
    });
  } catch (err) {
    console.warn(`⚠️ Falha de rede ao contatar a API: ${err}. Nenhuma atualização feita.`);
    process.exit(0);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    // Rate limit or server errors are transient — don't fail the workflow.
    if (res.status === 429 || res.status >= 500) {
      console.warn(
        `⚠️ API indisponível (${res.status} ${res.statusText}). Nenhuma atualização feita.`
      );
      process.exit(0);
    }
    console.error(`❌ Erro na API: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }

  const { matches: apiMatches } = (await res.json()) as { matches: ApiMatch[] };

  // Indexar por (homeInternalId_awayInternalId_YYYY-MM-DD em UTC)
  const apiLookup = new Map<string, ApiMatch>();
  for (const m of apiMatches) {
    const homeId = toInternalId(m.homeTeam.tla);
    const awayId = toInternalId(m.awayTeam.tla);
    const dateUTC = m.utcDate.slice(0, 10);
    apiLookup.set(`${homeId}_${awayId}_${dateUTC}`, m);
  }

  const results: Record<
    string,
    {
      homeScore: number;
      awayScore: number;
      status: MatchStatus;
      winner?: "home" | "away";
      penaltyHomeScore?: number;
      penaltyAwayScore?: number;
    }
  > = {};
  const unmatched: string[] = [];

  // Resolve knockout-stage participants (e.g. "1º Grupo A", "3º A/B/C/D/F")
  // from the current group standings before matching against the API —
  // otherwise every knockout match's homeId/awayId stays null and gets
  // skipped below, even after the teams are actually known.
  const resolvedMatches = COPA_MATCHES.map(resolveMatchParticipants);

  for (const match of resolvedMatches) {
    // Matches whose participants aren't determined yet (e.g. "Vencedor Jogo
    // 73" before the Round of 32 has been played) are skipped.
    if (!match.homeId || !match.awayId) {
      continue;
    }

    const dateUTC = new Date(match.kickoff).toISOString().slice(0, 10);
    const key = `${match.homeId}_${match.awayId}_${dateUTC}`;
    const apiMatch = apiLookup.get(key);

    if (!apiMatch) {
      unmatched.push(`Jogo ${match.id}: ${match.homeId} x ${match.awayId} (${dateUTC})`);
      continue;
    }

    if (!Object.hasOwn(STATUS_MAP, apiMatch.status)) {
      console.warn(
        `⚠️ Jogo ${match.id}: status "${apiMatch.status}" não mapeado em STATUS_MAP — usando "scheduled".`
      );
    }
    const status = STATUS_MAP[apiMatch.status] ?? "scheduled";
    const wentToPenalties = apiMatch.score.duration === "PENALTY_SHOOTOUT";
    const penaltyHome = apiMatch.score.penalties?.home;
    const penaltyAway = apiMatch.score.penalties?.away;
    const hasPenaltyScore =
      wentToPenalties && typeof penaltyHome === "number" && typeof penaltyAway === "number";

    // When the match went to penalties, fullTime is regularTime + extraTime +
    // penalties summed — subtract the shootout goals to get the actual match
    // score (excluding the shootout), which is what should be displayed.
    const homeScore = hasPenaltyScore
      ? (apiMatch.score.fullTime.home ?? 0) - penaltyHome
      : apiMatch.score.fullTime.home;
    const awayScore = hasPenaltyScore
      ? (apiMatch.score.fullTime.away ?? 0) - penaltyAway
      : apiMatch.score.fullTime.away;

    if (homeScore !== null && awayScore !== null) {
      // For knockout matches, the API's top-level winner already accounts
      // for extra time/penalties — a tied score doesn't mean a draw.
      const winner =
        match.stage !== "grupos" && apiMatch.score.winner
          ? API_WINNER_TO_INTERNAL[apiMatch.score.winner]
          : undefined;
      results[String(match.id)] = {
        homeScore,
        awayScore,
        status,
        ...(winner && { winner }),
        ...(hasPenaltyScore && {
          penaltyHomeScore: penaltyHome,
          penaltyAwayScore: penaltyAway,
        }),
      };
    }
  }

  if (unmatched.length > 0) {
    console.warn(`⚠️ ${unmatched.length} partidas sem correspondência na API:`);
    unmatched.forEach(u => console.warn(`  - ${u}`));
    console.warn(
      "Adicione entradas em API_TLA_TO_INTERNAL se os TLAs da API diferirem dos nossos IDs."
    );
  }

  const output = { updatedAt: new Date().toISOString(), results };
  const outputDir = join(process.cwd(), "content/copa-resultados");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "results.json"), JSON.stringify(output, null, 2) + "\n");

  console.log(
    `${Object.keys(results).length} resultados escritos em content/copa-resultados/results.json`
  );
}

main().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
