"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parseRequirement, normalizeCode } from "@/lib/shared/planner/requirements";
import { meetingsFor } from "@/lib/shared/planner/solver";
import type { PlannerOffer, PlannerGoal } from "@/lib/shared/planner/types";

export function CustomOfferForm({
  semester,
  onAdd,
}: {
  semester: string;
  onAdd: (offer: PlannerOffer, goal: PlannerGoal) => void;
}) {
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  return (
    <details className="rounded-lg border p-4">
      <summary className="cursor-pointer font-medium">
        Adicionar disciplina ou turma personalizada
      </summary>
      <p className="my-3 text-sm text-muted-foreground">
        Use para uma oferta externa ou ausente da lista. Ela pertence somente ao seu planejamento.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={e => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const get = (key: string) => String(data.get(key) ?? "").trim();
          const schedule = get("schedule").toUpperCase();
          if (!meetingsFor(schedule).length) {
            setError("Horário inválido. Exemplo: 35M23 ou 2M12 4T34.");
            return;
          }
          const code = normalizeCode(get("code") || `CUSTOM${Date.now()}`);
          const hours = get("hours");
          const goal: PlannerGoal = {
            code,
            name: get("name"),
            priority: "high",
            equivalents: [],
            workload: hours ? Number(hours) : null,
            prerequisite: parseRequirement(get("pre")),
            corequisite: parseRequirement(get("co")),
            requirementsKnown: verified,
            completed: false,
            unlocks: 0,
          };
          const offer: PlannerOffer = {
            id: `manual:${crypto.randomUUID()}`,
            code,
            name: goal.name,
            section: get("section"),
            semester,
            schedule,
            teacher: get("teacher"),
            location: get("location") || null,
            coordinates: null,
            source: "MANUAL",
            reservations: {},
            totalSeats: null,
            availableSeats: null,
            demand: null,
            observedAt: new Date().toISOString(),
            sourceUrl: null,
          };
          onAdd(offer, goal);
          form.reset();
          setVerified(false);
          setError("");
        }}
      >
        {(
          [
            ["name", "Nome da disciplina", "text", true],
            ["code", "Código (opcional)", "text", false],
            ["section", "Turma", "text", true],
            ["schedule", "Horário SIGAA (ex.: 35M23)", "text", true],
            ["hours", "Carga horária (h)", "number", false],
            ["teacher", "Docente (opcional)", "text", false],
            ["location", "Local/prédio (opcional)", "text", false],
            ["pre", "Pré-requisitos (códigos com E/OU)", "text", false],
            ["co", "Correquisitos (códigos com E/OU)", "text", false],
          ] as const
        ).map(([key, label, type, required]) => (
          <div key={key}>
            <Label htmlFor={`custom-${key}`}>{label}</Label>
            <Input
              id={`custom-${key}`}
              name={key}
              type={type}
              required={required}
              maxLength={256}
              min={0}
              max={1000}
            />
          </div>
        ))}
        <label className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 text-sm">
          <Checkbox checked={verified} onCheckedChange={v => setVerified(v === true)} />
          Conferi os requisitos desta disciplina na fonte oficial. Sem essa confirmação, ela ficará
          a verificar.
        </label>
        <p className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground">
          Aproveitamento de uma disciplina personalizada no curso precisa de confirmação. Não
          adicionamos equivalência automática.
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button type="submit">Adicionar ao planejamento</Button>
      </form>
    </details>
  );
}
