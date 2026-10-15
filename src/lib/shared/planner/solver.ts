import { createProgressPlanner } from "./progress";
import { simulateApprovals } from "./simulated-approvals";
import { groupConsecutiveSlots, parseHorarioToSlots } from "../calendario/utils";
import { checkRequirement, describeRequirement, normalizeCode } from "./requirements";
import type {
  Meeting,
  PlannerInput,
  PlannerBlockingChoice,
  PlannerOffer,
  PlannerResult,
  PlannerSolution,
  Selection,
  TimeWindow,
} from "./types";

const minute = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export const timeLabel = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export function meetingsFor(schedule: string): Meeting[] {
  return groupConsecutiveSlots(parseHorarioToSlots(schedule)).map(
    ({ day, startSlot, endSlot }) => ({
      day: day - 1,
      start: minute(startSlot.startTime),
      end: minute(endSlot.endTime),
    })
  );
}
export const overlaps = (a: Meeting, b: Meeting) =>
  a.day === b.day && a.start < b.end && b.start < a.end;
export function fitsAvailability(
  meeting: Meeting,
  windows: TimeWindow[],
  mode: "blocked" | "available"
): boolean {
  if (windows.some(window => window.kind !== "available" && overlaps(meeting, window))) {
    return false;
  }
  if (mode === "blocked") {
    return true;
  }
  const available = windows
    .filter(w => w.kind === "available" && w.day === meeting.day)
    .sort((a, b) => a.start - b.start);
  let covered = meeting.start;
  for (const window of available) {
    if (window.start > covered) {
      break;
    }
    if (window.end > covered) {
      covered = window.end;
    }
    if (covered >= meeting.end) {
      return true;
    }
  }
  return false;
}
export function reservedFor(offer: PlannerOffer, courseId: string | null): number | null {
  return offer.source === "SIGAA" && courseId ? (offer.reservations[courseId] ?? null) : null;
}
export function distanceBetween(a: PlannerOffer, b: PlannerOffer): number | null {
  if (!a.coordinates || !b.coordinates) {
    return null;
  }
  const rad = (n: number) => (n * Math.PI) / 180;
  const lat = rad(b.coordinates.lat - a.coordinates.lat);
  const lng = rad(b.coordinates.lng - a.coordinates.lng);
  const v =
    Math.sin(lat / 2) ** 2 +
    Math.cos(rad(a.coordinates.lat)) * Math.cos(rad(b.coordinates.lat)) * Math.sin(lng / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v))));
}
const compare = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return b[i] - a[i];
    }
  }
  return 0;
};

/** Bounded deterministic search; constraints are never relaxed when the budget is reached. */
export function solvePlanner(
  input: PlannerInput,
  budget = { maxNodes: 100000, maxMs: 1500 }
): PlannerResult {
  const started = Date.now();
  const { settings } = input;
  const minimumHours = settings.minWorkload;
  const maximumHours = settings.maxWorkload;
  const completed = new Set(input.completedCodes.map(normalizeCode));
  const simulation = simulateApprovals(input.goals, input.assumedPassedCodes);
  const satisfied = new Set([...completed, ...simulation.assumedPassedCodes]);
  const progressPlanner = createProgressPlanner(simulation.goals, satisfied, settings);
  const inactiveGoals = simulation.goals.filter(
    goal => goal.completed || satisfied.has(normalizeCode(goal.code))
  );
  const inactiveOfferCodes = new Set([
    ...satisfied,
    ...inactiveGoals.flatMap(goal => [
      normalizeCode(goal.code),
      ...(settings.allowEquivalents ? goal.equivalents.map(normalizeCode) : []),
    ]),
  ]);
  const offersById = new Map(input.offers.map(offer => [offer.id, offer]));
  const fixed = new Set(
    input.fixedOfferIds.filter(id => {
      const offer = offersById.get(id);
      return !offer || !inactiveOfferCodes.has(normalizeCode(offer.code));
    })
  );
  const result: PlannerResult = {
    solutions: [],
    exclusions: [],
    limited: false,
    explored: 0,
    message: "",
  };
  const goals = simulation.goals.filter(
    goal =>
      !goal.completed && !satisfied.has(normalizeCode(goal.code)) && goal.priority !== "exclude"
  );
  if (goals.length > 80 || input.offers.length > 1500) {
    return { ...result, message: "Reduza para até 80 disciplinas e 1500 turmas por cálculo." };
  }
  const namesByCode = new Map(
    [...input.offers, ...input.goals].map(item => [normalizeCode(item.code), item.name])
  );
  const requirementLabel = (code: string) => {
    const name = namesByCode.get(normalizeCode(code));
    return name && normalizeCode(name) !== normalizeCode(code) ? `${name} (${code})` : code;
  };
  const meetings = new Map(input.offers.map(offer => [offer.id, meetingsFor(offer.schedule)]));
  const groups = goals
    .map(goal => {
      const reasons = new Set<string>();
      const prerequisite = checkRequirement(goal.prerequisite, satisfied);
      const uncertain = !goal.requirementsKnown || prerequisite === "unknown";
      const goalFixed = input.offers.filter(
        offer =>
          fixed.has(offer.id) &&
          (normalizeCode(offer.code) === goal.code ||
            (settings.allowEquivalents && goal.equivalents.includes(normalizeCode(offer.code))))
      );
      const options: Selection[] = [];
      for (const offer of input.offers) {
        const code = normalizeCode(offer.code);
        if (satisfied.has(code)) {
          continue;
        }
        if (code !== goal.code && !(settings.allowEquivalents && goal.equivalents.includes(code))) {
          continue;
        }
        const fail = (reason: string) => reasons.add(reason);
        if (settings.includeOptional === false && goal.curricularRequired === false) {
          fail("Optativas desativadas nesta simulação");
          continue;
        }
        if (
          settings.offerScope === "course" &&
          offer.source === "SIGAA" &&
          (!input.courseId ||
            !Object.prototype.hasOwnProperty.call(offer.reservations, input.courseId))
        ) {
          fail("Turma fora da oferta do curso selecionado");
          continue;
        }

        if (offer.semester !== input.semester) {
          fail("Oferta de outro semestre");
          continue;
        }
        if (goalFixed.length && !goalFixed.some(item => item.id === offer.id)) {
          continue;
        }
        if (prerequisite === "unmet") {
          fail(
            `Pré-requisito não atendido: ${describeRequirement(goal.prerequisite, requirementLabel)}`
          );
          continue;
        }
        if (uncertain && !settings.includeConditional) {
          fail("Requisitos a verificar; habilite cenários condicionais para comparar");
          continue;
        }
        if (input.excludedOfferIds?.includes(offer.id)) {
          fail("Turma excluída por você");
          continue;
        }
        const slots = meetings.get(offer.id) ?? [];
        if (!slots.length) {
          fail("Horário ausente ou não reconhecido");
          continue;
        }
        if (slots.some((slot, i) => slots.some((other, j) => j > i && overlaps(slot, other)))) {
          fail("Horários sobrepostos na própria turma");
          continue;
        }
        if (
          settings.respectAvailability !== false &&
          !slots.every(slot => fitsAvailability(slot, input.windows, settings.availabilityMode))
        ) {
          fail("Fora da disponibilidade ou em horário bloqueado");
          continue;
        }
        if (
          (settings.reservationMode === "only" || !settings.allowWithoutReservation) &&
          !(Number(reservedFor(offer, input.courseId)) > 0)
        ) {
          fail("Sem reserva confirmada para o curso selecionado");
          continue;
        }
        if (settings.onlyAvailableSeats && !(Number(offer.availableSeats) > 0)) {
          fail("Saldo disponível não confirmado");
          continue;
        }
        const conditional: string[] = [];
        if (uncertain) {
          conditional.push(`${goal.code}: requisitos a verificar`);
        }
        if (checkRequirement(goal.prerequisite, completed) !== "met" && prerequisite === "met") {
          conditional.push(`${goal.code}: depende da aprovação simulada em disciplinas atuais`);
        }
        if (goal.workload === null) {
          conditional.push(`${goal.code}: carga horária a verificar`);
        }
        if (goal.workload === null && !settings.includeConditional) {
          fail("Carga horária a verificar");
          continue;
        }
        if (offer.source === "MANUAL") {
          conditional.push(`${goal.code}: oferta informada manualmente`);
        }
        options.push({ goal, offer, conditional });
      }
      if (!options.length && !reasons.size) {
        reasons.add(
          "Nenhuma turma localizada nas ofertas consultadas para este código ou equivalentes; isso não comprova ausência de oferta no SIGAA"
        );
      }
      result.exclusions.push({ code: goal.code, name: goal.name, reasons: [...reasons] });
      options.sort(
        (a, b) =>
          Number(reservedFor(b.offer, input.courseId)) -
            Number(reservedFor(a.offer, input.courseId)) || a.offer.id.localeCompare(b.offer.id)
      );
      return { goal, options, required: goal.priority === "required" || goalFixed.length > 0 };
    })
    .sort(
      (a, b) =>
        Number(b.required) - Number(a.required) ||
        (input.priorityOrder?.includes(a.goal.code)
          ? input.priorityOrder.indexOf(a.goal.code)
          : 2048) -
          (input.priorityOrder?.includes(b.goal.code)
            ? input.priorityOrder.indexOf(b.goal.code)
            : 2048) ||
        (settings.progressStrategy !== "balanced"
          ? progressPlanner.weight(b.goal.code) - progressPlanner.weight(a.goal.code)
          : 0) ||
        a.options.length - b.options.length ||
        a.goal.code.localeCompare(b.goal.code)
    );

  const fixedChoices: PlannerBlockingChoice[] = [...fixed].map(id => {
    const offer = offersById.get(id);
    return {
      kind: "fixed" as const,
      code: offer?.code ?? id,
      name: offer?.name ?? "Turma não encontrada na oferta carregada",
      offerId: id,
      section: offer?.section,
      reasons: result.exclusions.find(item => item.code === offer?.code)?.reasons ?? [],
    };
  });
  const requiredChoices: PlannerBlockingChoice[] = groups
    .filter(group => group.goal.priority === "required")
    .map(group => ({
      kind: "required" as const,
      code: group.goal.code,
      name: group.goal.name,
      reasons: result.exclusions.find(item => item.code === group.goal.code)?.reasons ?? [],
    }));
  const blocked = [
    ...requiredChoices.filter(
      item => !groups.find(group => group.goal.code === item.code)?.options.length
    ),
    ...fixedChoices.filter(
      item => !groups.some(group => group.options.some(option => option.offer.id === item.offerId))
    ),
  ];
  if (blocked.length) {
    return {
      ...result,
      blockingChoices: blocked,
      message: `Há uma turma fixada ou disciplina exigida sem opção viável: ${blocked.map(item => `${item.name} (${item.code})${item.section ? ` · turma ${item.section}` : ""}`).join("; ")} nos filtros atuais. Desfixe a turma ou retire a exigência abaixo para tentar novamente.`,
    };
  }

  const eligibleCount = groups.filter(group => group.options.length > 0).length;
  if (eligibleCount < settings.minClasses) {
    return {
      ...result,
      message: `Você exige pelo menos ${settings.minClasses} disciplinas, mas apenas ${eligibleCount} têm turmas viáveis nos horários e filtros atuais. Confira as exclusões.`,
    };
  }
  const selected: Selection[] = [];
  const selectedCodes = new Set<string>();
  const metrics = (
    final = false
  ): {
    days: number;
    gaps: number;
    transfers: number;
    distance: number | null;
    unknown: boolean;
  } | null => {
    const daily = new Map<number, { slot: Meeting; offer: PlannerOffer }[]>();
    for (const selection of selected) {
      for (const slot of meetings.get(selection.offer.id) ?? []) {
        const day = daily.get(slot.day) ?? [];
        day.push({ slot, offer: selection.offer });
        daily.set(slot.day, day);
      }
    }
    if (daily.size > settings.maxDays) {
      return null;
    }
    let gaps = 0,
      transfers = 0,
      distance: number | null = null,
      unknown = false;
    for (const day of daily.values()) {
      day.sort((a, b) => a.slot.start - b.slot.start);
      let dayGaps = 0;
      for (let i = 1; i < day.length; i++) {
        const prev = day[i - 1],
          next = day[i];
        if (overlaps(prev.slot, next.slot)) {
          return null;
        }
        const gap = next.slot.start - prev.slot.end;
        dayGaps += gap;
        if (prev.offer.id === next.offer.id) {
          continue;
        }
        const sameLocation =
          prev.offer.location &&
          next.offer.location &&
          normalizeCode(prev.offer.location) === normalizeCode(next.offer.location);
        if (!sameLocation) {
          const meters = distanceBetween(prev.offer, next.offer);
          if (meters !== null) {
            distance = Math.max(distance ?? 0, meters);
          }
          if (
            !prev.offer.location ||
            !next.offer.location ||
            (settings.maxDistanceMeters !== null && meters === null)
          ) {
            unknown = true;
          }
          if (prev.offer.location && next.offer.location) {
            transfers++;
          }
          if (final && gap < settings.transferMinutes) {
            return null;
          }
          if (
            final &&
            settings.maxDistanceMeters !== null &&
            meters !== null &&
            meters > settings.maxDistanceMeters
          ) {
            return null;
          }
        }
      }
      if (final && dayGaps > settings.maxGapMinutes) {
        return null;
      }
      gaps += dayGaps;
    }
    if (final && unknown && settings.requireLocations && !settings.includeConditional) {
      return null;
    }
    return { days: daily.size, gaps, transfers, distance, unknown };
  };
  const record = (workload: number) => {
    if (
      selected.length < settings.minClasses ||
      workload < minimumHours ||
      [...fixed].some(id => !selected.some(item => item.offer.id === id))
    ) {
      return;
    }
    for (let index = 0; index < selected.length; index++) {
      const item = selected[index];
      if (
        item.goal.curricularRequired !== false ||
        item.goal.priority === "required" ||
        item.goal.priority === "high" ||
        input.priorityOrder?.includes(item.goal.code) ||
        fixed.has(item.offer.id) ||
        (settings.progressStrategy !== "balanced" && progressPlanner.weight(item.goal.code) > 0)
      ) {
        continue;
      }
      if (
        selected.length - 1 < settings.minClasses ||
        workload - (item.goal.workload ?? 0) < minimumHours
      ) {
        continue;
      }
      const kept = selected.filter((_item, i) => i !== index);
      const keptCodes = new Set([
        ...satisfied,
        ...kept.flatMap(other => [other.goal.code, normalizeCode(other.offer.code)]),
      ]);
      if (
        kept.some(other => {
          const state = checkRequirement(other.goal.corequisite, keptCodes);
          return state === "unmet" || (state === "unknown" && !settings.includeConditional);
        })
      ) {
        continue;
      }
      selected.splice(index, 1);
      const validWithout = Boolean(metrics(true));
      selected.splice(index, 0, item);
      if (validWithout) {
        return;
      }
    }
    const codes = new Set([
      ...satisfied,
      ...selected.flatMap(item => [item.goal.code, normalizeCode(item.offer.code)]),
    ]);
    const extra: string[] = [];
    for (const item of selected) {
      const co = checkRequirement(item.goal.corequisite, codes);
      if (co === "unmet" || (co === "unknown" && !settings.includeConditional)) {
        return;
      }
      if (co === "unknown") {
        extra.push(`${item.goal.code}: correquisito a verificar`);
      }
    }
    const stats = metrics(true);
    if (!stats) {
      return;
    }
    if (stats.unknown) {
      extra.push("Deslocamento a verificar: falta localização ou coordenadas");
    }
    const institutionalMinimum = input.institutionalWorkload?.minimum;
    const institutionalMaximum = input.institutionalWorkload?.maximum;
    if (
      institutionalMinimum !== null &&
      institutionalMinimum !== undefined &&
      workload < institutionalMinimum
    ) {
      extra.push(
        `Carga de ${workload}h abaixo do mínimo de referência do currículo (${institutionalMinimum}h); matrícula depende de confirmação no SIGAA`
      );
    }
    if (
      institutionalMaximum !== null &&
      institutionalMaximum !== undefined &&
      workload > institutionalMaximum
    ) {
      extra.push(
        `Carga de ${workload}h acima do máximo de referência do currículo (${institutionalMaximum}h); matrícula depende de confirmação no SIGAA`
      );
    }
    const high = selected.filter(item => item.goal.priority === "high").length;
    const optional = selected.filter(item => item.goal.priority === "optional").length;
    const reserved = selected.filter(
      item => Number(reservedFor(item.offer, input.courseId)) > 0
    ).length;
    const conditional = [...new Set([...selected.flatMap(item => item.conditional), ...extra])];
    const modeScore =
      settings.mode === "days"
        ? [-stats.days, -stats.gaps, -stats.transfers]
        : settings.mode === "travel"
          ? [-stats.transfers, -(stats.distance ?? 0), -stats.days]
          : [-stats.gaps, -stats.days, -stats.transfers];
    const progressScore =
      settings.progressStrategy === "balanced"
        ? []
        : progressPlanner.evaluate(selected.map(item => item.goal.code)).score;
    const score = [
      ...(input.priorityOrder ?? []).map(code =>
        selected.some(item => item.goal.code === code) ? 1 : 0
      ),
      ...progressScore,
      high,
      selected.filter(item => item.goal.curricularRequired !== false).length,
      -selected.filter(item => item.goal.curricularRequired === false).length,
      optional,
      settings.reservationMode === "any" ? 0 : reserved,
      -conditional.length,
      selected.reduce((n, item) => n + item.goal.unlocks, 0),
      ...modeScore,
    ];
    const id = selected
      .map(item => `${item.goal.code}:${item.offer.id}`)
      .sort()
      .join("|");
    if (result.solutions.some(solution => solution.id === id)) {
      return;
    }
    const solution: PlannerSolution = {
      id,
      selections: [...selected],
      score,
      workload,
      days: stats.days,
      gapMinutes: stats.gaps,
      reserved,
      transfers: stats.transfers,
      maxDistanceMeters: stats.distance,
      travelUnknown: stats.unknown,
      conditional,
      omitted: groups
        .filter(group => !selected.some(item => item.goal.code === group.goal.code))
        .map(group => ({
          code: group.goal.code,
          name: group.goal.name,
          reason: group.options.length ? ("combination" as const) : ("filters" as const),
        })),
    };
    result.solutions.push(solution);
    result.solutions.sort((a, b) => compare(a.score, b.score) || a.id.localeCompare(b.id));
    result.solutions = result.solutions.slice(0, 3);
  };
  const search = (index: number, workload: number) => {
    if (++result.explored > budget.maxNodes || Date.now() - started > budget.maxMs) {
      result.limited = true;
      return;
    }
    if (index === groups.length) {
      record(workload);
      return;
    }
    const group = groups[index];
    if (selected.length < settings.maxClasses) {
      for (const option of group.options) {
        if (result.limited) {
          return;
        }
        const code = normalizeCode(option.offer.code);
        if (selectedCodes.has(code)) {
          continue;
        }
        const nextWorkload = workload + (option.goal.workload ?? 0);
        if (nextWorkload > maximumHours) {
          continue;
        }
        selected.push(option);
        selectedCodes.add(code);
        if (metrics()) {
          search(index + 1, nextWorkload);
        }
        selected.pop();
        selectedCodes.delete(code);
      }
    }
    if (!group.required && !result.limited) {
      search(index + 1, workload);
    }
  };
  search(0, 0);
  for (const solution of result.solutions) {
    solution.progress = progressPlanner.evaluate(
      solution.selections.map(item => item.goal.code)
    ).progress;
  }
  result.message = result.solutions.length
    ? result.limited
      ? "Melhores opções encontradas no limite de cálculo; não é garantia de ótimo global."
      : "Combinações encontradas sem relaxar suas restrições."
    : "Nenhuma combinação atende a todas as restrições. Confira as exclusões, turmas fixadas, requisitos e limites de horários/carga.";
  if (!result.solutions.length) {
    result.blockingChoices = [...requiredChoices, ...fixedChoices].map(item => ({
      ...item,
      reasons: ["Não foi encontrada uma combinação com estas escolhas e os limites atuais."],
    }));
    const eligible = groups.filter(group => group.options.length);
    if (
      eligible.length &&
      eligible.every(group => group.goal.workload !== null && group.goal.workload > 0)
    ) {
      const lightest = Math.min(...eligible.map(group => group.goal.workload ?? 0));
      if (maximumHours < lightest) {
        result.message = `As disciplinas viáveis têm carga a partir de ${lightest}h no semestre, mas a carga máxima configurada é ${maximumHours}h. Carga semestral é diferente de duração da aula ou janela entre aulas.`;
      }
    }
  }
  return result;
}
