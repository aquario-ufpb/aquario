"use client";
import { useEffect, useRef, useState } from "react";
import type { PlannerInput, PlannerResult } from "@/lib/shared/planner/types";

export function usePlannerSolver() {
  const active = useRef<Worker | null>(null);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancel = () => {
    active.current?.terminate();
    active.current = null;
    setRunning(false);
  };
  const invalidate = () => {
    cancel();
    setResult(null);
    setError(null);
  };
  useEffect(() => () => active.current?.terminate(), []);
  const run = (input: PlannerInput, onComplete?: () => void) => {
    cancel();
    setError(null);
    setRunning(true);
    try {
      const worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
      active.current = worker;
      worker.onmessage = (event: MessageEvent<{ result?: PlannerResult; error?: string }>) => {
        if (active.current !== worker) {
          return;
        }
        if (event.data.result) {
          onComplete?.();
          setResult(event.data.result);
        }
        setError(event.data.error ?? null);
        cancel();
      };
      worker.onerror = () => {
        if (active.current !== worker) {
          return;
        }
        setError("O cálculo não iniciou neste navegador. Tente novamente.");
        cancel();
      };
      worker.postMessage(input);
    } catch {
      setError("Este navegador não conseguiu iniciar o cálculo em segundo plano.");
      cancel();
    }
  };
  return { result, running, error, run, cancel, invalidate };
}
