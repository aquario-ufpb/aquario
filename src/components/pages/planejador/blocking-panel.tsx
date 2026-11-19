"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeBlocking, type BlockingItem } from "@/lib/shared/planner/blocking-analysis";
import { describeRequirement, normalizeCode } from "@/lib/shared/planner/requirements";
import type { PlannerGoal } from "@/lib/shared/planner/types";

export type BlockingPanelProps = {
  goals: PlannerGoal[];
  completedCodes: string[];
  assumedPassedCodes: string[];
  /** First generated solution, [] when there is none. */
  suggestedCodes: string[];
  curriculumMatched: boolean;
  isLoading?: boolean;
};

function Group<T extends BlockingItem>({
  id,
  title,
  hint,
  items,
  render,
  showOptional = false,
  affected,
}: {
  id: string;
  title: string;
  hint: string;
  items: T[];
  render: (item: T) => React.ReactNode;
  /** Optional disciplines stay visible only when the selection affects them. */
  showOptional?: boolean;
  /** Codes involved in a delay; their optionals stay visible too. */
  affected: Set<string>;
}) {
  const hidden = (item: T) => item.optional && !showOptional && !affected.has(item.code);
  const main = items.filter(item => !hidden(item));
  const optional = items.filter(hidden);
  return (
    <section aria-labelledby={id} className="space-y-1">
      <h4 id={id} className="font-medium">
        {title} ({items.length})
      </h4>
      <p className="text-muted-foreground">{hint}</p>
      {items.length === 0 && <p className="text-muted-foreground">Nenhuma.</p>}
      <ul className="space-y-2">{main.map(render)}</ul>
      {optional.length > 0 && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Optativas ({optional.length})
          </summary>
          <ul className="mt-2 space-y-2">{optional.map(render)}</ul>
        </details>
      )}
    </section>
  );
}

export function BlockingPanel({
  goals,
  completedCodes,
  assumedPassedCodes,
  suggestedCodes,
  curriculumMatched,
  isLoading = false,
}: BlockingPanelProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [chosen, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  // The planner passes fresh arrays on every render; key the analysis on their contents.
  const completedKey = completedCodes.join("|");
  const assumedKey = assumedPassedCodes.join("|");
  const byCode = useMemo(
    () => new Map(goals.map(goal => [normalizeCode(goal.code), goal])),
    [goals]
  );
  // Offered codes outside the curriculum are valid when a goal lists them as an equivalent.
  const equivalentCodes = useMemo(
    () => new Set(goals.flatMap(goal => goal.equivalents.map(normalizeCode))),
    [goals]
  );
  const inCurriculum = (code: string) =>
    byCode.has(normalizeCode(code)) || equivalentCodes.has(normalizeCode(code));
  // Codes from another curriculum (course switch, stale suggestion) leave S for good, so they do
  // not come back if the curriculum changes again. An empty curriculum is a loading state: keep S.
  useEffect(() => {
    if (!byCode.size) {
      return;
    }
    setSelected(previous => {
      const kept = previous.filter(inCurriculum);
      return kept.length === previous.length ? previous : kept;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCode, equivalentCodes]);
  const selected = useMemo(
    () => chosen.filter(inCurriculum),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chosen, byCode, equivalentCodes]
  );
  const analysis = useMemo(
    () =>
      analyzeBlocking({
        goals,
        completedCodes: completedKey ? completedKey.split("|") : [],
        assumedPassedCodes: assumedKey ? assumedKey.split("|") : [],
        selected,
      }),
    [goals, completedKey, assumedKey, selected]
  );
  const nameOf = (code: string) => byCode.get(normalizeCode(code))?.name ?? code;
  const inSelection = new Set(selected.map(normalizeCode));
  const toVerify = new Set(analysis.toVerify.map(item => normalizeCode(item.code)));
  const affected = new Set(
    analysis.delayed.flatMap(({ cause, delays }) => [cause, ...delays].map(item => item.code))
  );

  if (isLoading) {
    return (
      <p role="status" className="text-sm">
        Carregando currículo e histórico…
      </p>
    );
  }
  if (!goals.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem currículo para analisar. Conecte o SIGAA ou escolha seu curso para ver o que cada
        cadeira libera.
      </p>
    );
  }

  const query = search.trim().toLocaleLowerCase();
  const candidates = query
    ? goals
        .filter(
          goal =>
            !goal.completed &&
            !inSelection.has(normalizeCode(goal.code)) &&
            `${goal.code} ${goal.name}`.toLocaleLowerCase().includes(query)
        )
        .slice(0, 6)
    : [];
  const add = (code: string) => {
    setSelected(previous => [...previous, code]);
    setSearch("");
    searchRef.current?.focus();
  };
  const remove = (code: string) => {
    setSelected(previous => previous.filter(item => item !== code));
    searchRef.current?.focus();
  };
  const label = (item: BlockingItem) => (
    <p>
      <span>{item.name}</span> <span className="text-muted-foreground">· {item.code}</span>
    </p>
  );
  const pressable = "transition-transform active:scale-[0.97] motion-reduce:transform-none";

  return (
    <div className="space-y-4 text-xs">
      {!curriculumMatched && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          O currículo do SIGAA é diferente do cadastrado no Aquário. Os pré-requisitos não puderam
          ser confirmados, então quase tudo aparece como “a verificar”.
        </p>
      )}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Escolha as cadeiras que pretende pagar agora (S) e veja o que elas liberam e o que fica
          para depois.
        </p>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={searchRef}
            className="pl-9"
            aria-label="Buscar cadeira para pagar agora"
            placeholder="Buscar por nome ou código"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && candidates[0]) {
                e.preventDefault();
                add(candidates[0].code);
              } else if (e.key === "Escape") {
                setSearch("");
              }
            }}
          />
        </div>
        {query && (
          <ul className="divide-y rounded-md border">
            {candidates.map(goal => (
              <li key={goal.code}>
                <button
                  type="button"
                  aria-label={`Adicionar ${goal.name}`}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  onClick={() => add(goal.code)}
                >
                  {goal.name} <span className="text-xs text-muted-foreground">· {goal.code}</span>
                </button>
              </li>
            ))}
            {candidates.length === 0 && (
              <li className="px-3 py-2 text-muted-foreground">
                Nenhuma cadeira pendente encontrada.
              </li>
            )}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.map(code => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1 font-medium">
              {nameOf(code)}
              <button
                type="button"
                aria-label={`Remover ${nameOf(code)}`}
                className={`rounded-full p-0.5 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${pressable}`}
                onClick={() => remove(code)}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {selected.length === 0 && (
            <span className="text-muted-foreground">Nenhuma cadeira em S.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className={pressable}
            disabled={!suggestedCodes.length}
            title={suggestedCodes.length ? undefined : "Gere uma grade para usar esta opção"}
            onClick={() => setSelected([...new Set(suggestedCodes)])}
          >
            Usar grade gerada
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={pressable}
            disabled={!selected.length}
            onClick={() => {
              setSelected([]);
              searchRef.current?.focus();
            }}
          >
            Limpar
          </Button>
        </div>
        <div aria-live="polite" className="space-y-1">
          {analysis.invalidSelected.map(code => (
            <p key={code} className="text-amber-700 dark:text-amber-400">
              {toVerify.has(code)
                ? `${nameOf(code)} precisa ser verificada com a coordenação (requisito não confirmado) e não conta para liberar outras cadeiras.`
                : `${nameOf(code)} não pode ser cursada agora (falta pré-requisito) e não conta para liberar outras cadeiras.`}
            </p>
          ))}
          {analysis.ignoredSelected.map(code => (
            <p key={code} className="text-muted-foreground">
              {nameOf(code)} já está cumprida e foi ignorada.
            </p>
          ))}
          {analysis.creditedBySelection.map(code => (
            <p key={code} className="text-muted-foreground">
              {nameOf(code)} ({code}) também conta como cumprida, por equivalência.
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t pt-3">
        <Group
          affected={affected}
          id="blocking-available"
          title="Disponíveis agora"
          hint="Pré-requisitos cumpridos; podem entrar em S."
          items={analysis.available}
          render={item => (
            <li key={item.code} className="space-y-0.5">
              {label(item)}
              {item.noRegisteredRequirement && (
                <Badge variant="outline" className="font-normal">
                  sem requisito registrado
                </Badge>
              )}
            </li>
          )}
        />
        <Group
          affected={affected}
          id="blocking-unlocked"
          title="Liberadas depois"
          hint="Ficam disponíveis se você for aprovado em S."
          items={analysis.unlockedLater}
          showOptional
          render={item => (
            <li key={item.code} className="text-emerald-700 dark:text-emerald-400">
              {label(item)}
            </li>
          )}
        />
        <Group
          affected={affected}
          id="blocking-blocked"
          title="Bloqueadas"
          hint="Continuam bloqueadas mesmo com aprovação em S."
          items={analysis.blocked}
          render={item => (
            <li key={item.code} className="space-y-0.5">
              {label(item)}
              <p className="text-amber-700 dark:text-amber-400">
                Falta: {describeRequirement(item.pendingRule)}
              </p>
              {item.dependents > 0 && (
                <p className="text-muted-foreground">
                  {item.dependents}{" "}
                  {item.dependents === 1 ? "cadeira depende" : "cadeiras dependem"} dela
                </p>
              )}
              {item.chain.length > 0 && (
                <details className="text-muted-foreground">
                  <summary className="cursor-pointer">
                    Cadeia completa ({item.chain.length})
                  </summary>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                    {item.chain.map(code => (
                      <li key={code}>
                        {nameOf(code)} · {code}
                        {inSelection.has(code) && (
                          <Badge variant="secondary" className="ml-1.5 font-normal">
                            já em S
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          )}
        />
        <section aria-labelledby="blocking-delayed" className="space-y-1">
          <h4 id="blocking-delayed" className="font-medium">
            Atrasadas por não pagar agora ({analysis.delayed.length})
          </h4>
          <p className="text-muted-foreground">
            Cadeiras disponíveis fora de S que liberariam outras se fossem pagas agora.
          </p>
          {analysis.delayed.length === 0 && <p className="text-muted-foreground">Nenhuma.</p>}
          <ul className="space-y-2">
            {analysis.delayed.map(({ cause, delays }) => (
              <li key={cause.code} className="space-y-0.5">
                <p>
                  <span>{cause.name}</span>{" "}
                  <span className="text-muted-foreground">· {cause.code}</span>
                </p>
                <p className="text-amber-700 dark:text-amber-400">
                  atrasa {delays.map(delay => `${delay.name} (${delay.code})`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <Group
          affected={affected}
          id="blocking-verify"
          title="A verificar"
          hint="Requisitos ilegíveis, cíclicos ou fora do currículo; confirme com a coordenação."
          items={analysis.toVerify}
          render={item => (
            <li key={item.code} className="space-y-0.5">
              {label(item)}
            </li>
          )}
        />
      </div>
    </div>
  );
}
