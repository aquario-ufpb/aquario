import { COPA_MATCHES } from "../matches";
import { COPA_GROUP_LETTERS, COPA_TEAMS } from "../teams";

const TEAM_IDS = new Set(COPA_TEAMS.map(team => team.id));

describe("COPA_MATCHES dataset invariants", () => {
  it("has the full 104-match schedule", () => {
    expect(COPA_MATCHES).toHaveLength(104);
  });

  it("has unique match ids", () => {
    const ids = COPA_MATCHES.map(match => match.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references teams that exist in COPA_TEAMS", () => {
    for (const match of COPA_MATCHES) {
      if (match.homeId) {
        expect(TEAM_IDS.has(match.homeId)).toBe(true);
      }
      if (match.awayId) {
        expect(TEAM_IDS.has(match.awayId)).toBe(true);
      }
    }
  });

  it("has a valid, parseable kickoff for every match", () => {
    for (const match of COPA_MATCHES) {
      expect(Number.isNaN(new Date(match.kickoff).getTime())).toBe(false);
    }
  });

  it("group-stage matches carry a group; knockout matches carry placeholder labels", () => {
    for (const match of COPA_MATCHES) {
      if (match.stage === "grupos") {
        expect(match.grupo).toBeDefined();
        expect(match.homeId).not.toBeNull();
        expect(match.awayId).not.toBeNull();
      } else {
        // Knockout sides are undefined until results are known, so a label is required.
        if (match.homeId === null) {
          expect(match.homeLabel).toBeTruthy();
        }
        if (match.awayId === null) {
          expect(match.awayLabel).toBeTruthy();
        }
      }
    }
  });
});

describe("COPA_TEAMS dataset invariants", () => {
  it("has 48 teams with unique ids", () => {
    expect(COPA_TEAMS).toHaveLength(48);
    const ids = COPA_TEAMS.map(team => team.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has exactly 4 teams in each of the 12 groups", () => {
    for (const grupo of COPA_GROUP_LETTERS) {
      const teams = COPA_TEAMS.filter(team => team.grupo === grupo);
      expect(teams).toHaveLength(4);
    }
  });
});
