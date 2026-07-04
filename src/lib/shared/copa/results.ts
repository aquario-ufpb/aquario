import { z } from "zod";
import resultsJson from "@/content/copa-resultados/results.json";
import type { CopaMatch, CopaMatchWithResult, MatchStatus } from "./types";

export type StoredResult = {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  /** Knockout-stage winner (accounts for extra time/penalties). Undefined for group-stage matches. */
  winner?: "home" | "away";
  /** Penalty shootout score. Present only when the match was decided on penalties. */
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
};

const StoredResultSchema = z.object({
  homeScore: z.number(),
  awayScore: z.number(),
  status: z.enum(["scheduled", "live", "finished"]),
  winner: z.enum(["home", "away"]).optional(),
  penaltyHomeScore: z.number().optional(),
  penaltyAwayScore: z.number().optional(),
});

const ResultsFileSchema = z.object({
  updatedAt: z.string(),
  results: z.record(StoredResultSchema),
});

export type ResultsFile = z.infer<typeof ResultsFileSchema>;

export type GetMatchResult = (matchId: number) => StoredResult | null;

export function makeGetMatchResult(results: ResultsFile["results"]): GetMatchResult {
  return matchId => results[String(matchId)] ?? null;
}

// Snapshot bundled at build time. Used by the CI script (which always runs
// against a freshly-checked-out repo, so this is current there), by tests,
// and as a fallback if the live fetch below fails.
const staticData: ResultsFile = ResultsFileSchema.parse(resultsJson);

/** @deprecated for page rendering — prefer fetchLiveResultsFile() + makeGetMatchResult() so the site reflects results without a new deploy. Still fine for the CI script and tests, which always run against fresh data. */
export const getMatchResult: GetMatchResult = makeGetMatchResult(staticData.results);

export const resultsUpdatedAt: string = staticData.updatedAt;

const LIVE_RESULTS_URL =
  "https://raw.githubusercontent.com/aquario-ufpb/aquario/main/content/copa-resultados/results.json";

/**
 * Fetches the current results.json from the main branch at request/build
 * time, with Next.js ISR revalidation — so newly-committed scores reach the
 * live site without needing a new release/deploy. Falls back to the
 * snapshot bundled at build time if the fetch fails.
 */
export async function fetchLiveResultsFile(): Promise<ResultsFile> {
  try {
    const res = await fetch(LIVE_RESULTS_URL, { next: { revalidate: 300 } });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return ResultsFileSchema.parse(await res.json());
  } catch (err) {
    console.error("fetchLiveResultsFile: falling back to bundled snapshot:", err);
    return staticData;
  }
}

export function withResult(
  match: CopaMatch,
  getResult: GetMatchResult = getMatchResult
): CopaMatchWithResult {
  const result = getResult(match.id);
  return {
    ...match,
    homeScore: result?.homeScore ?? null,
    awayScore: result?.awayScore ?? null,
    matchStatus: result?.status ?? "scheduled",
    penaltyHomeScore: result?.penaltyHomeScore ?? null,
    penaltyAwayScore: result?.penaltyAwayScore ?? null,
  };
}
