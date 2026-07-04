import { COPA_MATCHES } from "./matches";
import { getMatchResult } from "./results";
import { COPA_TEAMS } from "./teams";
import type { CopaGroupLetter, CopaMatch } from "./types";

type TeamStanding = {
  teamId: string;
  grupo: CopaGroupLetter;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
};

function compareStandings(a: TeamStanding, b: TeamStanding): number {
  if (b.pts !== a.pts) {
    return b.pts - a.pts;
  }
  const gdA = a.gf - a.ga;
  const gdB = b.gf - b.ga;
  if (gdB !== gdA) {
    return gdB - gdA;
  }
  return b.gf - a.gf;
}

function buildStandings(): Map<CopaGroupLetter, TeamStanding[]> {
  const map = new Map<CopaGroupLetter, Map<string, TeamStanding>>();

  for (const team of COPA_TEAMS) {
    if (!map.has(team.grupo)) {
      map.set(team.grupo, new Map());
    }
    map.get(team.grupo)?.set(team.id, {
      teamId: team.id,
      grupo: team.grupo,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    });
  }

  for (const match of COPA_MATCHES) {
    if (match.stage !== "grupos" || !match.homeId || !match.awayId) {
      continue;
    }
    const result = getMatchResult(match.id);
    if (!result || result.status !== "finished") {
      continue;
    }

    const grupo = match.grupo as CopaGroupLetter;
    const groupMap = map.get(grupo);
    if (!groupMap) {
      continue;
    }
    const home = groupMap.get(match.homeId);
    const away = groupMap.get(match.awayId);
    if (!home || !away) {
      continue;
    }

    home.played++;
    away.played++;
    home.gf += result.homeScore;
    home.ga += result.awayScore;
    away.gf += result.awayScore;
    away.ga += result.homeScore;

    if (result.homeScore > result.awayScore) {
      home.wins++;
      home.pts += 3;
      away.losses++;
    } else if (result.awayScore > result.homeScore) {
      away.wins++;
      away.pts += 3;
      home.losses++;
    } else {
      home.draws++;
      home.pts++;
      away.draws++;
      away.pts++;
    }
  }

  const result = new Map<CopaGroupLetter, TeamStanding[]>();
  for (const [grupo, teamMap] of map) {
    result.set(grupo, [...teamMap.values()].sort(compareStandings));
  }
  return result;
}

// Computed once at module load (all data is static/build-time)
const GROUP_STANDINGS = buildStandings();

function getBestThirds(): Map<CopaGroupLetter, TeamStanding> {
  const thirds = [...GROUP_STANDINGS.values()]
    .map(s => s[2])
    .filter((t): t is TeamStanding => t !== undefined)
    .sort(compareStandings)
    .slice(0, 8);

  const result = new Map<CopaGroupLetter, TeamStanding>();
  for (const t of thirds) {
    result.set(t.grupo, t);
  }
  return result;
}

const BEST_THIRDS = getBestThirds();

type ThirdSlotKey = string;

/**
 * FIFA publishes a fixed official table mapping each "3º" knockout slot to a
 * specific group letter, based on which combination of 8 groups (out of 12)
 * produced a qualifying third-placed team. A generic constraint solver
 * (backtracking/most-constrained-variable) is NOT sufficient here: multiple
 * valid perfect matchings exist for the current qualifying-group combination
 * (22, verified by exhaustive enumeration) and only one of them is the
 * official FIFA assignment — a generic solver has no way to prefer it.
 *
 * This table hardcodes the verified-correct slot → group mapping for the
 * qualifying combination currently produced by content/copa-resultados —
 * groups A, C, G, H not among the best 8 thirds. If the group-stage results
 * change which 8 groups qualify, this table must be updated to match FIFA's
 * official document for the new combination.
 */
const MATCH_ID_TO_THIRD_GROUP: Record<number, CopaGroupLetter> = {
  74: "D",
  77: "F",
  79: "E",
  80: "K",
  82: "I",
  81: "B",
  85: "J",
  88: "L",
};

function buildThirdAssignments(): Map<ThirdSlotKey, string | null> {
  const slots: Array<{ key: ThirdSlotKey; matchId: number; groups: CopaGroupLetter[] }> = [];

  for (const match of COPA_MATCHES) {
    if (match.stage === "grupos") {
      continue;
    }
    for (const side of ["home", "away"] as const) {
      const label = side === "home" ? match.homeLabel : match.awayLabel;
      if (!label) {
        continue;
      }
      const m = label.match(/^3º ([A-L/]+)$/);
      if (!m) {
        continue;
      }
      slots.push({
        key: `${match.id}-${side}`,
        matchId: match.id,
        groups: m[1].split("/") as CopaGroupLetter[],
      });
    }
  }

  const result = new Map<ThirdSlotKey, string | null>();
  const used = new Set<CopaGroupLetter>();
  const unresolved: typeof slots = [];

  for (const slot of slots) {
    const preferredGroup = MATCH_ID_TO_THIRD_GROUP[slot.matchId];
    const preferred = preferredGroup ? BEST_THIRDS.get(preferredGroup) : undefined;
    if (preferred && slot.groups.includes(preferredGroup) && !used.has(preferredGroup)) {
      result.set(slot.key, preferred.teamId);
      used.add(preferredGroup);
    } else {
      unresolved.push(slot);
    }
  }

  // Fallback for slots whose official group didn't qualify this time around
  // (e.g. the qualifying-group combination shifted) — pick any remaining
  // eligible candidate rather than leaving the slot unresolved.
  for (const slot of unresolved) {
    const candidate = slot.groups
      .filter(g => BEST_THIRDS.has(g) && !used.has(g))
      .map(g => BEST_THIRDS.get(g) as TeamStanding)
      .sort(compareStandings)[0];
    if (candidate) {
      result.set(slot.key, candidate.teamId);
      used.add(candidate.grupo);
    } else {
      console.error(`buildThirdAssignments: no candidate available for slot ${slot.key}`);
    }
  }

  return result;
}

const THIRD_ASSIGNMENTS = buildThirdAssignments();

/**
 * Resolves every knockout match's participants in a single pass, processing
 * COPA_MATCHES in its declared order (group stage, then 32avos, oitavas,
 * quartas, semis, terceiro, final). Later stages reference only earlier
 * match ids ("Vencedor Jogo 73", "Perdedor Jogo 101"), so by the time a
 * later match is resolved, every match it depends on already has resolved
 * participants and — once played — a stored result to read the winner from.
 */
function buildResolvedMatches(): Map<number, CopaMatch> {
  const resolved = new Map<number, CopaMatch>();

  function resolveLabel(match: CopaMatch, side: "home" | "away"): string | null {
    const label = side === "home" ? match.homeLabel : match.awayLabel;
    if (!label) {
      return null;
    }

    const posGroup = label.match(/^(\d+)º Grupo ([A-L])$/);
    if (posGroup) {
      const pos = parseInt(posGroup[1]) - 1;
      const grupo = posGroup[2] as CopaGroupLetter;
      return GROUP_STANDINGS.get(grupo)?.[pos]?.teamId ?? null;
    }

    if (label.match(/^3º /)) {
      return THIRD_ASSIGNMENTS.get(`${match.id}-${side}`) ?? null;
    }

    const outcome = label.match(/^(Vencedor|Perdedor) Jogo (\d+)$/);
    if (outcome) {
      const [, kind, refIdStr] = outcome;
      const refMatch = resolved.get(Number(refIdStr));
      if (!refMatch || !refMatch.homeId || !refMatch.awayId) {
        return null;
      }
      const result = getMatchResult(refMatch.id);
      if (!result || result.status !== "finished" || !result.winner) {
        return null;
      }
      const winnerId = result.winner === "home" ? refMatch.homeId : refMatch.awayId;
      const loserId = result.winner === "home" ? refMatch.awayId : refMatch.homeId;
      return kind === "Vencedor" ? winnerId : loserId;
    }

    return null;
  }

  for (const match of COPA_MATCHES) {
    if (match.stage === "grupos") {
      resolved.set(match.id, match);
      continue;
    }
    resolved.set(match.id, {
      ...match,
      homeId: match.homeId ?? resolveLabel(match, "home"),
      awayId: match.awayId ?? resolveLabel(match, "away"),
    });
  }

  return resolved;
}

const RESOLVED_MATCHES = buildResolvedMatches();

/**
 * Returns the match with resolved homeId/awayId for knockout stages.
 * Group-stage matches are returned unchanged.
 */
export function resolveMatchParticipants(match: CopaMatch): CopaMatch {
  return RESOLVED_MATCHES.get(match.id) ?? match;
}
