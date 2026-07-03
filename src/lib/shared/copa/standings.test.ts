import { COPA_MATCHES } from "./matches";
import { resolveMatchParticipants } from "./standings";

// Locks in the manually-verified FIFA best-third-place assignment for the
// current committed results.json, so a future change to the MRV tie-break
// or standings data fails loudly instead of silently reshuffling matchups.
describe("resolveMatchParticipants", () => {
  const EXPECTED_THIRD_PLACE_MATCHUPS: Record<number, [string, string]> = {
    74: ["GER", "PAR"],
    77: ["FRA", "SWE"],
    79: ["MEX", "ECU"],
    80: ["ENG", "COD"],
    82: ["BEL", "SEN"],
    81: ["USA", "BIH"],
    85: ["SUI", "ALG"],
    88: ["COL", "GHA"],
  };

  it("resolves every 3rd-place knockout slot to the expected team", () => {
    const matches32 = COPA_MATCHES.filter(m => m.stage === "32avos").map(resolveMatchParticipants);

    for (const [id, [homeId, awayId]] of Object.entries(EXPECTED_THIRD_PLACE_MATCHUPS)) {
      const match = matches32.find(m => m.id === Number(id));
      expect(match).toBeDefined();
      expect(match?.homeId).toBe(homeId);
      expect(match?.awayId).toBe(awayId);
    }
  });

  it("assigns each qualifying team to exactly one 3rd-place slot", () => {
    const matches32 = COPA_MATCHES.filter(m => m.stage === "32avos").map(resolveMatchParticipants);
    const thirdPlaceTeamIds = matches32
      .flatMap(m => [m.homeId, m.awayId])
      .filter((id): id is string => id !== null);

    expect(new Set(thirdPlaceTeamIds).size).toBe(thirdPlaceTeamIds.length);
  });
});
