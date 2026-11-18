# Solver de cadeiras (Análise de bloqueios) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel "Análise de bloqueios" no `/planejador` que, dado o histórico e um conjunto livre S de cadeiras a pagar, classifica o currículo em disponível agora, liberada depois, bloqueada, a verificar e mostra o que atrasa por uma cadeira ficar de fora.

**Architecture:** O grafo de pré-requisitos hoje embutido em `createProgressPlanner` vira o módulo `requirement-graph.ts`, usado por `progress.ts` e pelo novo `blocking-analysis.ts` (função pura). O painel React só chama `analyzeBlocking` e renderiza. Tudo roda no cliente, sem API nem migration.

**Tech Stack:** TypeScript strict, Jest (jsdom/node) + Testing Library, React 18, Tailwind/shadcn.

**Spec:** `docs/superpowers/specs/2026-11-18-solver-cadeiras-design.md` (v2). Ler antes de começar: o modelo de classificação e as invariantes do grafo estão lá, não são repetidos aqui.

## Global Constraints

- Branch `feature/solver-cadeiras`; commits Conventional Commits **em inglês**; **nenhuma atribuição de IA** em commits ou PR (hooks locais bloqueiam); **não commitar nem dar push sem o usuário pedir**. Os passos "Commit" abaixo só rodam com esse pedido.
- Os testes existentes não podem ser editados. Só se acrescentam testes novos.
- Equivalência só direcional e explícita; `simulateApprovals` nunca recebe H, só S′. Nenhum `unknown`, ciclo ou código fora do currículo vira "Bloqueada".
- Cadeira com `requirementsKnown=false` e `prerequisite=null` é "Disponível agora" com selo "sem requisito registrado".
- Estilo do projeto: `type` em vez de `interface`, sem `console.log`, textos de UI em PT-BR, `@/` como alias de `src/`.
- UI (Task 4): usar as skills `frontend-design:frontend-design` e `emil-design-eng`, subordinadas às diretrizes visuais já existentes do projeto.
- Antes de pedir revisão: `npm run check-all` e `npm run test` passando; entrada no `CHANGELOG.md` em `[Unreleased]`.

## Review Focus

- S com código inexistente, duplicado ou com caixa/acentos diferentes (`normalizeCode`): ignorar sem quebrar.
- Currículo divergente do SIGAA (`curriculumMatched=false`, tudo `requirementsKnown=false`): o painel avisa em vez de exibir tudo como "A verificar" sem explicação.
- `goals` vazio (sem currículo) e `isLoading`: estados próprios, sem erro.
- Cadeira com `goal.completed=true` mas fora de `completedCodes`: não aparece em nenhum grupo.
- Currículo grande (centenas de `goals`) com S grande: sem travar a UI.

---

### Task 1: Testes de caracterização de `progress.ts`

**Files:**
- Test: `src/lib/shared/planner/__tests__/progress.test.ts` (só acrescentar ao final; reutiliza os helpers `goal` e `settings` do arquivo)

**Interfaces:**
- Consumes: `createProgressPlanner(goals, completed: Set<string>, settings)` → `{ weight(code), evaluate(selected) }` (`progress.ts:13`).
- Produces: rede de segurança para a Task 3.

- [ ] **Step 1: `git checkout -b feature/solver-cadeiras`.**
- [ ] **Step 2: Acrescentar os testes** abaixo em um `describe("progress characterization")`, usando `progressStrategy: "unlock"` ou `"target"` conforme o caso.
  - `weight counts reliable downstream goals`: goals `A0, Z1, B2(Z1), C4, R3("B2 E C4")`, `completed = new Set()` → `weight("Z1") === 2`, `weight("C4") === 1`, `weight("B2") === 1`, `weight("A0") === 0`.
  - `unlock score counts released and affected goals`: mesmos goals, `evaluate(["Z1"]).score` igual a `[1, 1, 2, 2]` e `progress.unlocked.map(i => i.code)` igual a `["B2"]`.
  - `any branch prefers the smaller set, then lexicographic order`: goals `X1, Y1, G("X1 OU Y1")`, target `G` → `evaluate([]).progress.remaining` com código `["X1"]`; trocando `X1` por `X1("W1")` + `W1`, passa a `["Y1"]`.
  - `cycles never become guaranteed`: `C1("C2")`, `C2("C1")`, target `C1` → `evaluate([]).progress.warnings` contém "requisitos desconhecidos ou cíclicos".
- [ ] **Step 3: Rodar** `npx jest src/lib/shared/planner/__tests__/progress.test.ts`. Esperado: todos passam **sem mudar `progress.ts`**. Se algum valor esperado divergir do comportamento atual, o teste é que está errado: ajustar o valor, nunca o código.
- [ ] **Step 4: Commit** `test: characterize planner progress graph behavior`.

---

### Task 2: Extrair `requirement-graph.ts` e migrar `progress.ts`

**Files:**
- Create: `src/lib/shared/planner/requirement-graph.ts`
- Create: `src/lib/shared/planner/__tests__/requirement-graph.test.ts`
- Modify: `src/lib/shared/planner/progress.ts`

**Interfaces:**
- Consumes: `normalizeCode`, `PlannerGoal`, `Requirement`.
- Produces (usado pela Task 4):
  ```ts
  export type Missing = { codes: Set<string>; uncertain: boolean };
  export type Waiver = { target: string; requires?: string };
  export type RequirementGraph = {
    byCode: Map<string, PlannerGoal>;
    outgoing: Map<string, Set<string>>;            // código -> cadeiras que o citam
    missing(goal: PlannerGoal, done: Set<string>, waivers?: Waiver[]): Missing;
    reachable(from: string, blocked?: Set<string>): Set<string>; // sem atravessar `blocked`
    path(start: string, destination: string, blocked?: Set<string>): string[] | null;
  };
  export const references: (rule: Requirement | null) => string[];
  export function buildRequirementGraph(goals: PlannerGoal[]): RequirementGraph;
  ```

- [ ] **Step 1: Escrever `requirement-graph.test.ts`** (falha primeiro), com goals no estilo de `progress.test.ts`:
  - `missing returns the transitive chain`: `P1, A1("P1"), B2("A1")` → `missing(B2, new Set()).codes` = `{A1, P1}`, `uncertain=false`.
  - `missing is uncertain for cycles, unknown ancestors and codes outside the curriculum` (três casos).
  - `missing keeps the any-branch tie-break` (mesmos valores da Task 1).
  - `missing honors waivers`: `{target:"B2", requires:"A1"}` → vazio; `{target:"B2"}` → vazio e certo; waiver de outro target não muda nada. O waiver vale só para o goal pedido, não para os ancestrais.
  - `reachable skips blocked nodes`: `reachable("P1")` = `{A1, B2}`; com `blocked = {A1}` = `{}`.
  - `path` devolve a menor rota ou `null`.
- [ ] **Step 2: Rodar e ver falhar** (`Cannot find module`).
- [ ] **Step 3: Implementar `buildRequirementGraph`** movendo a lógica de `outgoing`, `missing` e `path` de `progress.ts:23-107` **sem alterá-la**: mesma ordenação de ramos `any`, mesmo `trail` de ciclos, mesma normalização. Mudanças permitidas: `done`/`blocked` viram parâmetros em vez de closure sobre `completed`, e `waivers` entram só no nível do goal pedido. `reachable` é um BFS único por chamada (substitui o `path()` por par no cálculo de `downstream`).
- [ ] **Step 4: Migrar `progress.ts`:** `createProgressPlanner` chama `buildRequirementGraph(goals)` e mantém `pending`, `reliablePending`, `downstream` (agora `reachable(goal.code, completed)` ∩ `reliablePending`), `weight` e `evaluate` com o mesmo resultado.
- [ ] **Step 5: Rodar** `npx jest src/lib/shared/planner`. Esperado: `requirement-graph`, `progress` (incluindo a Task 1), `planner` e `discipline-impact` passam, sem editar nenhum teste existente.
- [ ] **Step 6: Commit** `refactor: extract requirement graph from progress planner`.

---

### Task 3: `analyzeBlocking` (função pura)

**Files:**
- Create: `src/lib/shared/planner/blocking-analysis.ts`
- Create: `src/lib/shared/planner/__tests__/blocking-analysis.test.ts`
- Modify: `src/lib/shared/planner/requirements.ts` (exportar `remainingRequirement`, movendo `remaining` de `discipline-impact.ts:13`)
- Modify: `src/lib/shared/planner/discipline-impact.ts` (importar de `requirements.ts`)

**Interfaces:**
- Consumes: `buildRequirementGraph` (Task 2), `checkRequirement`, `simulateApprovals`, `normalizeCode`.
- Produces (usado pela Task 4):
  ```ts
  export type BlockingItem = { code: string; name: string; optional: boolean };
  export type BlockedItem = BlockingItem & {
    pendingRule: Requirement | null; chain: string[]; dependents: number;
  };
  export type BlockingInput = {
    goals: PlannerGoal[]; completedCodes: string[]; assumedPassedCodes?: string[];
    selected: string[]; waivers?: Waiver[];
  };
  export type BlockingAnalysis = {
    available: (BlockingItem & { noRegisteredRequirement: boolean })[];
    unlockedLater: BlockingItem[];
    blocked: BlockedItem[];
    delayed: { cause: BlockingItem; delays: BlockingItem[] }[];
    toVerify: BlockingItem[];
    invalidSelected: string[]; ignoredSelected: string[]; creditedBySelection: string[];
  };
  export function analyzeBlocking(input: BlockingInput): BlockingAnalysis;
  ```
  `optional = curricularRequired === false`. `chain` = ancestrais pendentes de `missing(goal, H)`, ordenados de modo que cada código vem depois dos seus próprios pré-requisitos (desempate por código). Saídas ordenadas por `code`.

- [ ] **Step 1: Mover `remaining`** para `requirements.ts` como `remainingRequirement(rule, completed)`; `discipline-impact.test.ts` deve continuar passando sem edição (`npx jest discipline-impact`).
- [ ] **Step 2: Escrever `blocking-analysis.test.ts`** com este currículo (helper `goal` como em `discipline-impact.test.ts`): `P1`, `A1("P1")`, `B2("A1")`, `C3("A1 E D4")`, `D4`, `E5("A1 OU D4")`, `O1("A1", curricularRequired:false)`, `K9` (`requirementsKnown:false`, `prerequisite:null`), `U8` (`prerequisite:{kind:"unknown",raw:"…"}`, `requirementsKnown:false`), `X1("X2")`, `X2("X1")`, `F6("ZZ99")`, `G9` (`equivalents:["A1"]`). Casos (cada um com as asserções de códigos listadas):
  - `H=["P1"], S=["A1"]`: `unlockedLater` = `B2, E5, O1`; `blocked` = `C3` com `pendingRule` = código `D4`; `delayed` = `[{cause D4, delays [C3]}]`; `available` contém `D4` e `K9` (com `noRegisteredRequirement:true`) e não contém `A1`; `toVerify` = `F6, U8, X1, X2`; `creditedBySelection = ["G9"]` e `G9` não aparece em nenhum grupo.
  - `H=[], S=[]`: `delayed` = `[{P1→[A1]}, {D4→[E5]}]`; `blocked` inclui `A1` com `dependents === 4` (`B2, C3, E5, O1`) e `B2` com `chain = ["P1","A1"]`; `X1`/`X2` não contam em nenhum `dependents`.
  - `invalidSelected`: `H=["P1"], S=["B2"]` → `["B2"]`, e `B2` continua em `blocked`; `ignoredSelected`: `H=["P1"], S=["P1"]` → `["P1"]`.
  - `S` não conta como cumprida para outra de S: `H=["P1"], S=["A1","B2"]` → `B2` em `invalidSelected` (não conta em H′), mas ainda em `unlockedLater`, porque o `A1` válido cumpre o requisito dele em H′. Com `S=["B2"]` sozinho, `B2` continua em `blocked`.
  - Equivalência não transitiva: `W0(equivalents:["R0"])`, `R0(equivalents:["Q0"])`, `H=["Q0"], S=[]` → `creditedBySelection=[]`; `R0` e `W0` seguem listadas.
  - `waivers`: `{target:"C3", requires:"D4"}` com `H=["P1"], S=["A1"]` → `C3` em `unlockedLater`; `{target:"C3"}` com `H=[]` → `C3` em `available`.
  - `exclude` não remove: `A1` com `priority:"exclude"` continua nos grupos.
  - `goal.completed=true` fora de `completedCodes` não aparece; S com `" a1 "`/duplicata é normalizado e deduplicado; S com código inexistente vai para `invalidSelected` sem lançar.
  - Desempenho: 500 goals encadeados e `S` de 30 → resolve em menos de 1000 ms (limite folgado, só pega regressão O(n²) grosseira).
- [ ] **Step 3: Rodar e ver falhar.**
- [ ] **Step 4: Implementar `analyzeBlocking`** exatamente pela tabela "Modelo de classificação" da spec. Cálculo de H como em `discipline-impact.ts:38-45`. `isSatisfied` de waivers fica dentro de `requirement-graph.ts`/`blocking-analysis.ts`, num único ponto. Candidatos a X: **todas** as disponíveis agora fora de S′, sem poda por `missing` (a poda perde a outra ponta de um `OU`: com `G1("A1 OU B2")` e as duas disponíveis, `delayed` deve listar `A1` e `B2`). Teste esse caso. `dependents` usa `graph.reachable(code, H)` ∩ pendentes com `missing(·, H).uncertain === false`.
- [ ] **Step 5: Rodar** `npx jest src/lib/shared/planner`. Esperado: tudo verde.
- [ ] **Step 6: Commit** `feat: add course blocking analysis for planner`.

---

### Task 4: Painel `BlockingPanel` e montagem no planejador

**Files:**
- Create: `src/components/pages/planejador/blocking-panel.tsx`
- Create: `src/components/pages/planejador/__tests__/blocking-panel.test.tsx`
- Modify: `src/components/pages/planejador/enrollment-planner.tsx` (card após `planner-settings`, item de navegação em `~:770-775`)
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `analyzeBlocking`, `BlockingAnalysis` (Task 3).
- Produces:
  ```ts
  export type BlockingPanelProps = {
    goals: PlannerGoal[]; completedCodes: string[]; assumedPassedCodes: string[];
    suggestedCodes: string[];          // primeira solução gerada, [] se não houver
    curriculumMatched: boolean; isLoading?: boolean;
  };
  export function BlockingPanel(props: BlockingPanelProps): JSX.Element;
  ```

- [ ] **Step 1: Escrever `blocking-panel.test.tsx`** (Testing Library, estilo de `goals-list.test.tsx`) com os goals do currículo da Task 3:
  - com S vazio, mostra os cabeçalhos "Disponíveis agora", "Liberadas depois", "Bloqueadas", "Atrasadas por não pagar agora", "A verificar" com as contagens certas;
  - adicionar `A1` ao S (busca por nome ou código, remoção por chip) move `B2` para "Liberadas depois" e mostra "Atrasadas" com `D4 → C3`;
  - "Usar grade gerada" preenche S com `suggestedCodes`; "Limpar" esvazia;
  - S com cadeira indisponível mostra aviso e não a conta como cumprida;
  - cadeira de `K9` mostra o selo "sem requisito registrado";
  - optativas ficam dentro de um `<details>` recolhido, e só as afetadas por S são mostradas fora dele;
  - `isLoading` mostra estado de carregamento; `goals=[]` mostra "sem currículo"; `curriculumMatched=false` mostra aviso de currículo divergente.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3a: Antes de escrever o JSX, invocar as skills `frontend-design:frontend-design` e `emil-design-eng`** (pedido do usuário) para organizar a hierarquia, os estados e as microinterações do painel (chips de S, grupos recolhíveis, transições ao recalcular, foco e acessibilidade por teclado). Elas valem **dentro** das diretrizes do projeto: componentes de `ui/` (shadcn), Tailwind e tokens existentes, estilo visual de `discipline-impact.tsx` e `goals-list.tsx`. Sem fontes, paleta ou biblioteca de animação novas; respeitar `prefers-reduced-motion`. Os testes do Step 1 definem o comportamento e não mudam por causa da estética.
- [ ] **Step 3: Implementar `BlockingPanel`.** Estado de S via `useState`, resultado via `useMemo(() => analyzeBlocking(...))`. Para cada bloqueada: `pendingRule` descrita com `describeRequirement`, `dependents` ("N cadeiras dependem dela") e a cadeia completa em `<details>`. Reaproveitar `ui/` e o estilo de `discipline-impact.tsx`; textos em PT-BR.
- [ ] **Step 4: Montar em `enrollment-planner.tsx`** com as props `goals={simulation.goals}`, `completedCodes={academic.completedCodes}`, `assumedPassedCodes={assumePassed ? academic.enrolledCodes : []}`, `suggestedCodes={solver.result?.solutions[0]?.selections.map(s => s.goal.code) ?? []}`, `curriculumMatched={academic.curriculumMatched}`; `<Card id="planner-blocking">` depois do card `planner-settings`; item `{ id: "planner-blocking", label: "Bloqueios" }` na navegação. Nenhuma outra mudança nesse arquivo.
- [ ] **Step 5: `CHANGELOG.md`**, em `[Unreleased]`: `### Added` com **Análise de bloqueios no planejador** (quatro grupos, cadeira atrasada por não pagar agora, dispensas só na função pura); `### Changed` com refatoração do grafo de pré-requisitos, sem mudança de comportamento do solver.
- [ ] **Step 6: Verificar tudo:** `npm run check-all` e `npm run test`. Esperado: sem erros; os testes antigos intactos. Abrir `/planejador` com `npm run dev` e marcar cadeiras de verdade no navegador, incluindo o caso sem SIGAA.
- [ ] **Step 7: Commit** `feat: add blocking analysis panel to planner`.
- [ ] **Step 8 (PR, só se pedido):** descrição no template em PT-BR, citando a diferença deliberada em relação ao solver (cadeira sem requisito registrado vira "Disponível" com selo) e as limitações herdadas da spec; sem atribuição de IA.
