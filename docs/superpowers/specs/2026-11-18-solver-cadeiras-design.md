# Solver de cadeiras (Análise de bloqueios) — Design

Data: 2026-11-18 · Status: aprovado para planejamento · Revisão: v2, após verificação independente contra o código

## Intenção

O estudante quer saber, antes de se matricular, **o que acontece com o resto do currículo conforme as cadeiras que escolhe pagar no semestre**: o que fica disponível, o que só abre depois, o que continua travado (e por quê) e o que atrasa por uma cadeira ter ficado de fora. Hoje o `/planejador` mostra só o impacto de uma cadeira por vez (`getDisciplineImpact`, um passo à frente), e usa o grafo de pré-requisitos para pontuar horários (`progress.ts`) e para exibir `unlocked`/`paths` nos resultados.

## Metas

- Dado o histórico **H** e um conjunto livre **S** (cadeiras que pretende pagar agora), classificar cada cadeira pendente do currículo e responder o que muda se uma cadeira ficar de fora.
- Recalcular instantaneamente no cliente a cada marcação.
- Tudo em funções puras e testáveis, em `src/lib/shared/planner/`.

## Não-metas

- Co-requisito (`corequisite` existe em `PlannerGoal`, mas a análise não o lê; ver "Limitações herdadas").
- UI e persistência para dispensas da coordenação.
- Simular reprovação de cadeiras de S.
- Realce no grafo de `grades-curriculares` (etapa 2).
- Mudança de schema Prisma, rotas de API ou persistência de S.

## Anti-metas (falha mesmo que "funcione")

- Marcar como "Bloqueada" uma cadeira cujo requisito não conseguimos interpretar, inclusive por código fora do currículo ou por ciclo.
- Contar cadeira de S como cumprida para outra cadeira de S.
- Dois grafos de pré-requisitos divergentes no mesmo diretório.
- Inferir equivalência transitiva: `simulateApprovals` nunca recebe H, só S′.

## Restrições

- Reaproveitar `Requirement`, `checkRequirement`, `normalizeCode`, `simulateApprovals` e `buildAcademicContext` (que já converte o currículo do banco em AND de códigos quando não há SIGAA).
- Regra estrita: só H (mais cadeiras assumidas como aprovadas e equivalências diretas) cumpre pré-requisito.
- Ciclos não lançam erro nem travam.
- `progress.test.ts` e os demais testes existentes passam sem edição. Testes novos de caracterização entram **antes** da refatoração.
- Projeto de terceiros e AI-driven: branch `feature/...`, commits Conventional Commits em inglês sem atribuição de IA, PR no template em PT-BR, `CHANGELOG.md` em `[Unreleased]`, `npm run check-all` e `npm run test` passando.

## Abordagens consideradas

- **A. Extrair o grafo para módulo compartilhado (escolhida).** Um grafo só; custo: tocar no solver de horários, mitigado por testes de caracterização escritos antes.
- **B. Módulo independente sem tocar em `progress.ts`.** Mais rápido, deixa duas implementações do mesmo grafo.
- **C. Estender `getDisciplineImpact`.** É por cadeira clicada; vira motor de análise com nome errado.
- Cálculo no servidor descartado: o painel recalcula a cada marcação e os dados já estão no cliente.

## Decisões do usuário

- Estender o planejador; módulo puro; UI no `/planejador`.
- Regra estrita, com ponto de extensão para dispensa da coordenação: `waivers: { target: string; requires?: string }[]`, só na função pura e testada. Sem `requires`, dispensa todos os pré-requisitos de `target`; com `requires`, só aquele par.
- `unknown` nunca é "Bloqueada".
- Equivalências só direcionais e explícitas, via `simulateApprovals`, sem alterá-lo.
- Todas as cadeiras do currículo entram no cálculo; optativas recolhidas na UI.
- **S é seleção livre**, com botão "Usar grade gerada".
- Painel "Análise de bloqueios" no `/planejador`.
- Detalhe: pré-requisito mínimo pendente + contador de dependentes; cadeia completa ao expandir.
- **Cadeira sem nenhum requisito registrado** (`requirementsKnown = false` e `prerequisite = null`) é **"Disponível agora" com selo "sem requisito registrado"**. Só vai para "A verificar" quando há texto ilegível (`unknown`). Isso difere do solver de horários, que é mais conservador, e deve constar no código e no PR.

## Modelo de classificação (decisão minha, revisar)

Entradas: `goals`, `completedCodes`, `assumedPassedCodes`, `selected` (S), `waivers`.

- **H** = `completedCodes` ∪ goals com `completed` ∪ `simulateApprovals(goals, assumedPassedCodes)`, como em `discipline-impact.ts`.
- **S′** = cadeiras de S que não estão em H e estão **Disponíveis agora**. Uma cadeira de S fora disso vai para `invalidSelected` (indisponível) ou `ignoredSelected` (já concluída), com aviso na UI. Nenhuma das duas conta em H ∪ S′.
- **H′** = H ∪ S′ ∪ equivalências diretas de S′ (`simulateApprovals(goals, S′)` somente sobre S′, nunca sobre H). Cadeiras creditadas por equivalência de S′ vão para `creditedBySelection`.

Para cada cadeira pendente c (fora de H, de S′ e das creditadas por equivalência direta de S′; `exclude` **não** tira da análise, pois é filtro de busca e não fato acadêmico), na ordem:

1. `requirementsKnown = false` e `prerequisite ≠ null` → **A verificar**, seja o requisito ilegível (`unknown`) ou lido mas não confirmado (por exemplo, co-requisito ilegível). Só `prerequisite = null` com `requirementsKnown = false` é tratado como sem requisito (ver decisão acima).
2. `checkRequirement(c, H)` é `met` → **Disponível agora** (com selo se o requisito era nulo e `requirementsKnown = false`).
3. `checkRequirement(c, H′)` é `met` → **Liberada depois**.
4. Senão o requisito direto está `unmet`. Se `missing(c, H′)` é `uncertain` (ciclo, código fora do currículo ou ancestral desconhecido) → **A verificar**. Caso contrário → **Bloqueada**. Um `OU` com um ramo ainda não cumprido e ilegível (código fora do currículo, regra `unknown`) também é `uncertain`, mesmo havendo outro ramo conhecido: o ramo ilegível pode já estar cumprido. O ramo conhecido segue como dica em `chain`/`pendingRule`. O solver de horários mantém o critério otimista.

As quatro categorias formam uma **partição** das pendentes. **Atrasadas** é uma **visão cruzada**: `delayed = [{ cause: X, delays: [G...] }]`, em que X é Disponível agora, fora de S′, e G é Bloqueada em H′ mas passaria a ter requisito `met` em H′ ∪ {X} ∪ equivalências diretas de X. Teto conhecido: avalia um X por vez, então cadeira que precisa de duas ausências ao mesmo tempo não aparece; evoluir para pares se a coordenação pedir.

Candidatos X são **todas** as Disponíveis agora fora de S′ (sem poda por `missing`: a poda descartaria causas via equivalência direta de X e via ramo `any`; o custo de testar todas é desprezível). Correção v2.1 após revisão da Task 3.

`waivers` entram em `isSatisfied(goal, done)`, ponto único usado por `checkRequirement` e `missing`: cada função de grafo recebe `waivers` e trata o par (target, requires) como satisfeito só para aquele target.

## Saída (decisão minha, revisar)

```ts
type Item = { code: string; name: string; optional: boolean };
type BlockedItem = Item & {
  pendingRule: Requirement | null; // requisito direto restante (estilo remaining())
  chain: string[];                 // ancestrais pendentes em ordem topológica, p/ "ver cadeia"
  dependents: number;              // cadeias pendentes confiáveis que dependem dela
};
analyzeBlocking(input): {
  available: (Item & { noRegisteredRequirement: boolean })[];
  unlockedLater: Item[];
  blocked: BlockedItem[];
  delayed: { cause: Item; delays: Item[] }[];
  toVerify: Item[];
  invalidSelected: string[]; ignoredSelected: string[]; creditedBySelection: string[];
}
```

`optional = curricularRequired === false`. Goals personalizados não têm `curricularRequired` e contam como obrigatórias. Uma optativa é "afetada por S" quando seu grupo muda entre H e H′ ou quando aparece em `delayed`; só essas aparecem fora do bloco recolhido.

`dependents` é o número de cadeias pendentes alcançáveis pela adjacência reversa, com `missing(·, H).uncertain = false`, sem o filtro `includeOptional` do solver. O universo é o do currículo inteiro.

## Extração do grafo (decisão minha, revisar)

- `requirement-graph.ts` expõe `buildRequirementGraph(goals)` → `{ byCode, outgoing, missing(goal, done, waivers?), reachable(from, blocked?: Set) }`, sem `settings` nem `completed` capturados. Preservar exatamente: a ordenação de ramos `any` (sem incerteza, menos códigos, desempate lexicográfico), o `trail` de ciclos e a normalização atual de códigos.
- `reachable` é memoizado por nó, em vez de `path()` por par (que é O(n²·BFS) por marcação).
- `progress.ts` monta `pending`, `reliablePending` e `downstream` sobre esse módulo.
- **Antes** da refatoração, um commit só com testes de caracterização novos em `progress.test.ts` (não editar os existentes): `weight()`, `score` da estratégia `unlock`, contagens de `affected` e `downstream`, desempate do ramo `any`.

## Limitações herdadas (documentar, não resolver aqui)

- Co-requisito ilegível já força `requirementsKnown = false` em `buildAcademicContext`; a análise o trata como "A verificar" mesmo sem ler o campo.
- `matched = false` (currículo do SIGAA diferente do cadastrado) marca todas as cadeiras como `requirementsKnown = false`; a análise deve avisar o estudante em vez de exibir um painel quase todo "A verificar".

## UI (decisão minha, revisar)

- Componente novo `src/components/pages/planejador/blocking-panel.tsx`; estado de S em `useState` dentro dele.
- `enrollment-planner.tsx` só monta um `<Card id="planner-blocking">` depois do card `planner-settings`, na coluna direita, e um item `{ id: "planner-blocking", label: "Bloqueios" }` na navegação. Props: `goals={simulation.goals}`, `completedCodes={academic.completedCodes}`, `assumedPassedCodes` na mesma regra do `PlannerResults`, e `suggestedCodes` derivados da **primeira** solução de `solver.result` (sem subir estado do `PlannerResults`).
- Estados: carregando (`grade.isPending`), sem currículo, currículo divergente do SIGAA.
- Cadeiras cursando só contam como cumpridas quando o checkbox `assumePassed` está ligado; fora disso podem ser marcadas em S.
- Reaproveitar o estilo de `discipline-impact.tsx` e os componentes de `ui/`.

## Testes (mínimo)

`analyze-blocking.test.ts`: AND, OR com ramo desconhecido, `unknown`, sem requisito registrado, código fora do currículo, ciclo (classificação e `dependents`), cadeira de S indisponível, cadeira de S já concluída, equivalência de S creditando uma cadeira, ausência de equivalência transitiva sobre H, waiver por cadeira e por par, `exclude`, optativa afetada e não afetada, `delayed` com X que libera uma e que não libera nenhuma. Teste de componente do painel com S vazio e S preenchido. Mais os testes de caracterização de `progress.ts`.

## O que fica para quem constrói

- Textos finais em PT-BR e aparência do painel.
- Estrutura interna de `requirement-graph.ts`, respeitando as invariantes acima.
- Entrada em `CHANGELOG.md` (`Added`; `Changed` se `progress.ts` for refatorado).
