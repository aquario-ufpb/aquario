import resultsJson from "@/content/copa-resultados/results.json";
import type { CopaMatch, CopaMatchWithResult, MatchStatus } from "./types";

type StoredResult = {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
};

type ResultsFile = {
  updatedAt: string;
  results: Record<string, StoredResult>;
};

const data = resultsJson as ResultsFile;

export function getMatchResult(matchId: number): StoredResult | null {
  return data.results[String(matchId)] ?? null;
}

export function withResult(match: CopaMatch): CopaMatchWithResult {
  const result = getMatchResult(match.id);
  return {
    ...match,
    homeScore: result?.homeScore ?? null,
    awayScore: result?.awayScore ?? null,
    matchStatus: result?.status ?? "scheduled",
  };
}

export const resultsUpdatedAt: string = data.updatedAt;
