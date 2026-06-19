/**
 * Busca resultados da Copa do Mundo 2026 na football-data.org e escreve
 * content/copa-resultados/results.json com os placares das partidas encerradas.
 *
 * Uso: FOOTBALL_DATA_API_KEY=<key> tsx src/lib/shared/copa/update-results.ts
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { COPA_MATCHES } from "./matches";

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

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
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
  score: { fullTime: { home: number | null; away: number | null } };
};

async function main() {
  console.log("Buscando resultados da Copa do Mundo 2026...");

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": API_KEY! },
  });

  if (!res.ok) {
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

  const results: Record<string, { homeScore: number; awayScore: number; status: MatchStatus }> = {};
  const unmatched: string[] = [];

  for (const match of COPA_MATCHES) {
    // Partidas de mata-mata sem equipes definidas ainda são ignoradas.
    if (!match.homeId || !match.awayId) continue;

    const dateUTC = new Date(match.kickoff).toISOString().slice(0, 10);
    const key = `${match.homeId}_${match.awayId}_${dateUTC}`;
    const apiMatch = apiLookup.get(key);

    if (!apiMatch) {
      unmatched.push(`Jogo ${match.id}: ${match.homeId} x ${match.awayId} (${dateUTC})`);
      continue;
    }

    const status = STATUS_MAP[apiMatch.status] ?? "scheduled";
    const homeScore = apiMatch.score.fullTime.home;
    const awayScore = apiMatch.score.fullTime.away;

    if (homeScore !== null && awayScore !== null) {
      results[String(match.id)] = { homeScore, awayScore, status };
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
    `✅ ${Object.keys(results).length} resultados escritos em content/copa-resultados/results.json`
  );
}

main().catch(err => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
