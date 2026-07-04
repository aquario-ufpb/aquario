import { z } from "zod";
import resultsJson from "@/content/copa-resultados/results.json";
import type { CopaMatch, CopaMatchWithResult, MatchStatus } from "./types";

type StoredResult = {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  /** Knockout-stage winner (accounts for extra time/penalties). Undefined for group-stage matches. */
  winner?: "home" | "away";
};

const StoredResultSchema = z.object({
  homeScore: z.number(),
  awayScore: z.number(),
  status: z.enum(["scheduled", "live", "finished"]),
  winner: z.enum(["home", "away"]).optional(),
});

const ResultsFileSchema = z.object({
  updatedAt: z.string(),
  results: z.record(StoredResultSchema),
});

type ResultsFile = z.infer<typeof ResultsFileSchema>;

const data: ResultsFile = ResultsFileSchema.parse(resultsJson);

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
