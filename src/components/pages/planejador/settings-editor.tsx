import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlannerSettings } from "@/lib/shared/planner/types";
import { selectClass } from "./availability-editor";

export function SettingsEditor({
  settings,
  advanced = true,
  onChange,
}: {
  settings: PlannerSettings;
  advanced?: boolean;
  onChange: (value: PlannerSettings) => void;
}) {
  const change = <K extends keyof PlannerSettings>(key: K, value: PlannerSettings[K]) =>
    onChange({ ...settings, [key]: value });
  const checkbox = (
    key:
      | "allowEquivalents"
      | "allowWithoutReservation"
      | "includeConditional"
      | "onlyAvailableSeats",
    label: string
  ) => (
    <label className="flex items-start gap-2 text-sm">
      <Checkbox checked={settings[key]} onCheckedChange={value => change(key, value === true)} />
      {label}
    </label>
  );
  const numeric = (
    key: "minClasses" | "maxClasses" | "minWorkload" | "maxWorkload" | "maxDays" | "maxGapMinutes",
    label: string,
    max: number
  ) => (
    <div>
      <Label htmlFor={`planner-${key}`}>{label}</Label>
      <Input
        id={`planner-${key}`}
        type="number"
        min={0}
        max={max}
        value={settings[key]}
        onChange={e => change(key, Number(e.target.value))}
      />
    </div>
  );
  const invalidLimits =
    settings.minClasses > settings.maxClasses || settings.minWorkload > settings.maxWorkload;
  const limitsWarning = invalidLimits ? (
    <p role="alert" className="text-xs text-destructive">
      O mínimo não pode superar o máximo. Revise quantidade de disciplinas e carga semestral.
    </p>
  ) : null;
  if (!advanced) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {numeric("minClasses", "Mínimo de disciplinas", 12)}
          {numeric("maxClasses", "Máximo de disciplinas", 12)}
          {numeric("minWorkload", "Carga mínima no semestre (h)", 1000)}
          {numeric("maxWorkload", "Carga máxima no semestre (h)", 1000)}
        </div>
        {limitsWarning}
        <p className="text-xs text-muted-foreground">
          Carga é o total de horas das disciplinas no semestre. Os limites de carga e quantidade
          valem juntos. Outros filtros continuam ativos; confira-os no modo avançado.
        </p>
      </div>
    );
  }
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">Ajustar carga e preferências</summary>
      <div className="mt-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="availability-mode">Disponibilidade</Label>
            <select
              id="availability-mode"
              className={selectClass}
              value={settings.availabilityMode}
              onChange={e =>
                change("availabilityMode", e.target.value as PlannerSettings["availabilityMode"])
              }
            >
              <option value="blocked">Bloquear apenas meus impedimentos</option>
              <option value="available">Usar somente intervalos disponíveis</option>
            </select>
          </div>
          <div>
            <Label htmlFor="reservation-mode">Reservas para meu curso</Label>
            <select
              id="reservation-mode"
              className={selectClass}
              value={settings.reservationMode}
              onChange={e =>
                change("reservationMode", e.target.value as PlannerSettings["reservationMode"])
              }
            >
              <option value="prefer">Priorizar turmas com reserva</option>
              <option value="only">Somente com reserva confirmada</option>
              <option value="any">Não usar reserva na ordenação</option>
            </select>
          </div>
          <div>
            <Label htmlFor="optimization-mode">Entre grades com as mesmas prioridades</Label>
            <select
              id="optimization-mode"
              className={selectClass}
              value={settings.mode}
              onChange={e => change("mode", e.target.value as PlannerSettings["mode"])}
            >
              <option value="priorities">Favorecer progresso e reduzir janelas</option>
              <option value="days">Concentrar em menos dias</option>
              <option value="gaps">Reduzir janelas</option>
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={settings.offerScope === "course"}
            onCheckedChange={value =>
              change("offerScope", value === true ? "course" : "curriculum")
            }
          />
          Somente turmas ofertadas para meu curso
        </label>
        <p className="text-xs text-muted-foreground">
          Oferta para seu curso e reserva são filtros diferentes: uma turma ofertada pode ter zero
          vagas reservadas. Desativado, a busca considera as ofertas de todos os cursos para os
          códigos do seu currículo.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {checkbox("allowEquivalents", "Permitir equivalentes informadas no currículo")}
          {checkbox(
            "allowWithoutReservation",
            "Permitir alternativas sem reserva confirmada (exceto no modo estrito)"
          )}
          {checkbox(
            "includeConditional",
            "Comparar também cenários condicionais, com pendências visíveis"
          )}
          {checkbox(
            "onlyAvailableSeats",
            "Exigir saldo disponível confirmado (reservas não comprovam saldo)"
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {numeric("minClasses", "Mínimo de disciplinas", 12)}
          {numeric("maxClasses", "Máximo de disciplinas", 12)}
          {numeric("minWorkload", "Carga mínima no semestre (h)", 1000)}
          {numeric("maxWorkload", "Carga máxima no semestre (h)", 1000)}
        </div>
        {limitsWarning}
        <p className="text-xs text-muted-foreground">
          Os mínimos de disciplinas e de carga semestral são aplicados juntos. Uma disciplina de 60h
          não cabe em uma carga máxima de 1h; janelas entre aulas são configuradas abaixo em
          minutos.
        </p>
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">Dias e janelas</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {numeric("maxDays", "Máximo de dias por semana", 7)}
            {numeric("maxGapMinutes", "Máximo de janelas por dia (min)", 1440)}
          </div>
        </details>
      </div>
    </details>
  );
}
