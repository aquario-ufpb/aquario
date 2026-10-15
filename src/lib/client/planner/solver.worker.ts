import { solvePlanner } from "@/lib/shared/planner/solver";
import type { PlannerInput, PlannerResult } from "@/lib/shared/planner/types";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<PlannerInput>) => void) | null;
  postMessage: (value: { result?: PlannerResult; error?: string }) => void;
};
scope.onmessage = event => {
  try {
    scope.postMessage({ result: solvePlanner(event.data) });
  } catch {
    scope.postMessage({ error: "Não foi possível calcular. Revise suas turmas e restrições." });
  }
};
