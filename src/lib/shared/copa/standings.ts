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

/** Returns the 8 best third-place teams keyed by their group letter. */
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

/**
 * Resolves a knockout label to a team ID.
 * - "1º Grupo A" → 1st-place team of group A
 * - "2º Grupo B" → 2nd-place team of group B
 * - "3º A/B/C/D/F" → best qualifying 3rd-place team from those groups
 * Returns null when the group has not finished yet.
 */
export function resolveKnockoutLabel(label: string | undefined): string | null {
  if (!label) {
    return null;
  }

  const posGroup = label.match(/^(\d+)º Grupo ([A-L])$/);
  if (posGroup) {
    const pos = parseInt(posGroup[1]) - 1;
    const grupo = posGroup[2] as CopaGroupLetter;
    return GROUP_STANDINGS.get(grupo)?.[pos]?.teamId ?? null;
  }

  const third = label.match(/^3º ([A-L/]+)$/);
  if (third) {
    const groups = third[1].split("/") as CopaGroupLetter[];
    for (const g of groups) {
      const qualifier = BEST_THIRDS.get(g);
      if (qualifier) {
        return qualifier.teamId;
      }
    }
    return null;
  }

  return null;
}

/**
 * Returns the match with resolved homeId/awayId for knockout stages.
 * Group-stage matches are returned unchanged.
 */
export function resolveMatchParticipants(match: CopaMatch): CopaMatch {
  if (match.stage === "grupos") {
    return match;
  }
  return {
    ...match,
    homeId: match.homeId ?? resolveKnockoutLabel(match.homeLabel),
    awayId: match.awayId ?? resolveKnockoutLabel(match.awayLabel),
  };
}
