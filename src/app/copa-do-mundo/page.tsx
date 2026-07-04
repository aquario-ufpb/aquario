import { CopaClient } from "@/components/pages/copa/copa-client";
import { COPA_MATCHES, COPA_MATCHES_CHRONO } from "@/lib/shared/copa/matches";
import { fetchLiveResultsFile, makeGetMatchResult, withResult } from "@/lib/shared/copa/results";
import { createCopaResolver } from "@/lib/shared/copa/standings";

// Re-fetches content/copa-resultados/results.json from the main branch every
// 5 minutes (Next.js ISR) instead of relying on the snapshot bundled at
// build time — so scores committed by the scheduled Update Copa Results
// action reach the live site without a new release.
export const revalidate = 300;

export default async function CopaDoMundoPage() {
  const resultsFile = await fetchLiveResultsFile();
  const getResult = makeGetMatchResult(resultsFile.results);
  const resolveMatchParticipants = createCopaResolver(getResult);

  const matches = COPA_MATCHES.map(resolveMatchParticipants).map(match =>
    withResult(match, getResult)
  );
  const matchesChrono = COPA_MATCHES_CHRONO.map(resolveMatchParticipants).map(match =>
    withResult(match, getResult)
  );

  return <CopaClient matches={matches} matchesChrono={matchesChrono} />;
}
