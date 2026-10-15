import type { Requirement } from "./types";

export const normalizeCode = (code: string) => code.normalize("NFKC").trim().toUpperCase();

/** Explicit grammar: institutional prose remains unknown, never automatically satisfied. */
export function parseRequirement(raw: string | null | undefined): Requirement | null {
  if (!raw?.trim() || /^(?:nenhum|nenhuma|não há|nao ha|--|-|não possui)\.?$/i.test(raw.trim())) {
    return null;
  }
  const normalized = raw
    .toUpperCase()
    .replace(/\b(?:AND|E)\b|[,&;]/g, " & ")
    .replace(/\b(?:OR|OU)\b|\|/g, " | ");
  const tokens = normalized.match(/[A-Z]*\d[A-Z\d]*|[()&|]/g) ?? [];
  if (tokens.join("") !== normalized.replace(/\s/g, "") || tokens.length > 120) {
    return { kind: "unknown", raw };
  }
  let index = 0;
  const atom = (): Requirement => {
    const token = tokens[index++];
    if (token === "(") {
      const expression = any();
      if (tokens[index++] !== ")") {
        throw new Error("parenthesis");
      }
      return expression;
    }
    if (!token || !/^[A-Z]*\d[A-Z\d]*$/.test(token)) {
      throw new Error("code");
    }
    return { kind: "code", code: token };
  };
  const all = (): Requirement => {
    const items = [atom()];
    while (tokens[index] === "&") {
      index++;
      items.push(atom());
    }
    return items.length === 1 ? items[0] : { kind: "all", items };
  };
  const any = (): Requirement => {
    const items = [all()];
    while (tokens[index] === "|") {
      index++;
      items.push(all());
    }
    return items.length === 1 ? items[0] : { kind: "any", items };
  };
  try {
    const result = any();
    return index === tokens.length ? result : { kind: "unknown", raw };
  } catch {
    return { kind: "unknown", raw };
  }
}

export function checkRequirement(
  requirement: Requirement | null,
  satisfied: Set<string>
): "met" | "unmet" | "unknown" {
  if (!requirement) {
    return "met";
  }
  if (requirement.kind === "unknown") {
    return "unknown";
  }
  if (requirement.kind === "code") {
    return satisfied.has(normalizeCode(requirement.code)) ? "met" : "unmet";
  }
  const states = requirement.items.map(item => checkRequirement(item, satisfied));
  if (requirement.kind === "all") {
    return states.includes("unmet") ? "unmet" : states.includes("unknown") ? "unknown" : "met";
  }
  return states.includes("met") ? "met" : states.includes("unknown") ? "unknown" : "unmet";
}

export function describeRequirement(
  requirement: Requirement | null,
  labelCode: (code: string) => string = code => code
): string {
  if (!requirement) {
    return "Nenhum";
  }
  if (requirement.kind === "unknown") {
    return requirement.raw;
  }
  if (requirement.kind === "code") {
    return labelCode(requirement.code);
  }
  return `(${requirement.items.map(item => describeRequirement(item, labelCode)).join(requirement.kind === "all" ? " e " : " ou ")})`;
}
