import { fireEvent, render, screen, within } from "@testing-library/react";
import { BlockingPanel } from "../blocking-panel";
import { parseRequirement } from "@/lib/shared/planner/requirements";
import type { PlannerGoal } from "@/lib/shared/planner/types";

const goal = (
  code: string,
  prerequisite: string | null = null,
  extra: Partial<PlannerGoal> = {}
): PlannerGoal => ({
  code,
  name: `Nome ${code}`,
  prerequisite: parseRequirement(prerequisite),
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  curricularRequired: true,
  priority: "optional",
  workload: 60,
  equivalents: [],
  unlocks: 0,
  ...extra,
});
const goals = [
  goal("P1"),
  goal("A1", "P1"),
  goal("B2", "A1"),
  goal("C3", "A1 E D4"),
  goal("D4"),
  goal("E5", "A1 OU D4"),
  goal("O1", "A1", { curricularRequired: false }),
  goal("K9", null, { requirementsKnown: false }),
  goal("U8", null, {
    requirementsKnown: false,
    prerequisite: { kind: "unknown", raw: "Consultar coordenação" },
  }),
  goal("X1", "X2"),
  goal("X2", "X1"),
  goal("F6", "ZZ99"),
  goal("G9", null, { equivalents: ["A1"] }),
];
const props = {
  goals,
  completedCodes: ["P1"],
  assumedPassedCodes: [],
  suggestedCodes: [],
  curriculumMatched: true,
};
const group = (name: RegExp) => screen.getByRole("region", { name });
const add = (query: string, name: string) => {
  fireEvent.change(screen.getByLabelText("Buscar cadeira para pagar agora"), {
    target: { value: query },
  });
  fireEvent.click(screen.getByRole("button", { name: `Adicionar ${name}` }));
};

it("shows every group with its count when nothing is selected", () => {
  render(<BlockingPanel {...props} />);
  expect(screen.getByRole("heading", { name: "Disponíveis agora (4)" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Liberadas depois (0)" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Bloqueadas (4)" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Atrasadas por não pagar agora (2)" })
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "A verificar (4)" })).toBeInTheDocument();
});

it("adds by name or code, recalculates and removes through the chip", () => {
  render(<BlockingPanel {...props} />);
  add("nome a1", "Nome A1");
  expect(within(group(/^Liberadas depois/)).getByText("Nome B2")).toBeInTheDocument();
  const delayed = group(/^Atrasadas/);
  expect(within(delayed).getByText("Nome D4")).toBeInTheDocument();
  expect(delayed).toHaveTextContent("C3");
  const blocked = within(group(/^Bloqueadas/));
  expect(blocked.getByText("Nome C3")).toBeInTheDocument();
  expect(blocked.getByText("já em S")).toBeInTheDocument();
  expect(screen.getByText(/G9.*equivalência/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Remover Nome A1" }));
  expect(screen.getByRole("heading", { name: "Liberadas depois (0)" })).toBeInTheDocument();
  add("D4", "Nome D4");
  expect(screen.getByRole("button", { name: "Remover Nome D4" })).toBeInTheDocument();
});

it("fills S from the generated schedule and clears it", () => {
  render(<BlockingPanel {...props} suggestedCodes={["A1", "D4"]} />);
  fireEvent.click(screen.getByRole("button", { name: "Usar grade gerada" }));
  expect(screen.getByRole("button", { name: "Remover Nome A1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remover Nome D4" })).toBeInTheDocument();
  expect(within(group(/^Liberadas depois/)).getByText("Nome C3")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
  expect(screen.queryByRole("button", { name: /^Remover/ })).not.toBeInTheDocument();
});

it("disables the generated schedule button without a solution", () => {
  render(<BlockingPanel {...props} />);
  expect(screen.getByRole("button", { name: "Usar grade gerada" })).toBeDisabled();
});

it("warns about an unavailable selection and does not count it as passed", () => {
  render(<BlockingPanel {...props} />);
  add("B2", "Nome B2");
  expect(
    screen.getByText(
      /Nome B2 não pode ser cursada agora \(falta pré-requisito\) e não conta para liberar outras cadeiras/
    )
  ).toBeInTheDocument();
  expect(within(group(/^Bloqueadas/)).getByText("Nome B2")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Liberadas depois (0)" })).toBeInTheDocument();
});

it("marks disciplines without a registered requirement", () => {
  render(<BlockingPanel {...props} />);
  const item = within(group(/^Disponíveis agora/))
    .getByText("Nome K9")
    .closest("li") as HTMLElement;
  expect(within(item).getByText("sem requisito registrado")).toBeInTheDocument();
});

it("describes the pending rule, dependents and the full chain of a blocked discipline", () => {
  render(<BlockingPanel {...props} completedCodes={[]} />);
  const item = within(group(/^Bloqueadas/))
    .getByText("Nome A1")
    .closest("li") as HTMLElement;
  expect(item).toHaveTextContent("Falta: P1");
  expect(item).toHaveTextContent("4 cadeiras dependem dela");
  const chain = within(item)
    .getByText(/Cadeia completa/)
    .closest("details") as HTMLElement;
  expect(chain).not.toHaveAttribute("open");
  expect(chain).toHaveTextContent("P1");
});

it("collapses optional disciplines unless the selection or a delay affects them", () => {
  // O2 waits on B2, which is not available: not delayed by anyone, so it stays collapsed.
  const withO2 = [...goals, goal("O2", "B2", { curricularRequired: false })];
  render(<BlockingPanel {...props} goals={withO2} />);
  const blocked = within(group(/^Bloqueadas/));
  const collapsed = blocked.getByText("Nome O2").closest("details");
  expect(collapsed).not.toHaveAttribute("open");
  expect(collapsed).toHaveTextContent("Optativas (1)");
  // O1 is delayed by not taking A1 now, so it shows in its own group.
  expect(blocked.getByText("Nome O1").closest("details")).toBeNull();
  add("A1", "Nome A1");
  expect(
    within(group(/^Liberadas depois/))
      .getByText("Nome O1")
      .closest("details")
  ).toBeNull();
});

it("does not blame a missing prerequisite for an unconfirmed requirement", () => {
  render(<BlockingPanel {...props} />);
  add("U8", "Nome U8");
  expect(
    screen.getByText(
      /Nome U8 precisa ser verificada com a coordenação \(requisito não confirmado\)/
    )
  ).toBeInTheDocument();
  expect(screen.queryByText(/falta pré-requisito/)).not.toBeInTheDocument();
});

it("drops codes outside the current curriculum from S", () => {
  const { rerender } = render(<BlockingPanel {...props} suggestedCodes={["ZZ99", "A1"]} />);
  fireEvent.click(screen.getByRole("button", { name: "Usar grade gerada" }));
  expect(screen.queryByRole("button", { name: "Remover ZZ99" })).not.toBeInTheDocument();
  expect(screen.queryByText(/falta pré-requisito/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remover Nome A1" })).toBeInTheDocument();
  rerender(<BlockingPanel {...props} goals={[goal("Z1"), goal("Z2", "Z1")]} />);
  expect(screen.queryByRole("button", { name: /^Remover/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/não conta para liberar/)).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Disponíveis agora (1)" })).toBeInTheDocument();
});

it("shows loading, empty curriculum and mismatched curriculum states", () => {
  const { rerender } = render(<BlockingPanel {...props} isLoading />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando");
  rerender(<BlockingPanel {...props} goals={[]} />);
  expect(screen.getByText(/sem currículo/i)).toBeInTheDocument();
  rerender(<BlockingPanel {...props} curriculumMatched={false} />);
  expect(screen.getByText(/currículo do SIGAA é diferente/i)).toBeInTheDocument();
});
