import { fireEvent, render, screen } from "@testing-library/react";
import { GoalsList } from "../goals-list";
import type { PlannerGoal } from "@/lib/shared/planner/types";

const goal = (code: string, period: number | null): PlannerGoal => ({
  code,
  name: `Disciplina ${code}`,
  period,
  priority: "optional",
  equivalents: [],
  workload: 60,
  prerequisite: null,
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  unlocks: 0,
});
const props = {
  goals: [goal("ZERO", 0), goal("ONE", 1), goal("UNKNOWN", null)],
  completedCodes: [],
  onPriority: jest.fn(),
  onOrder: jest.fn(),
};
it("hides level zero by default, including searches, and offers an explicit filter", () => {
  render(<GoalsList {...props} order={[]} />);
  expect(screen.queryByText("Disciplina ZERO")).not.toBeInTheDocument();
  expect(screen.getByText("Disciplina ONE")).toBeInTheDocument();
  expect(screen.getByText("Disciplina UNKNOWN")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Buscar disciplinas pendentes"), {
    target: { value: "ZERO" },
  });
  expect(screen.queryByText("Disciplina ZERO")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: "Mostrar nível 0 (1)" }));
  expect(screen.getByText("Disciplina ZERO")).toBeInTheDocument();
});
it("keeps explicitly selected level zero priorities visible", () => {
  render(<GoalsList {...props} order={["ZERO"]} />);
  expect(
    screen.getByRole("list", { name: "Disciplinas em ordem de prioridade" })
  ).toHaveTextContent("Disciplina ZERO");
});

it("expands and collapses candidates without removing selected priorities", () => {
  const goals = Array.from({ length: 18 }, (_, i) => goal(`COURSE${i + 1}`, 1));
  render(<GoalsList {...props} goals={goals} order={["COURSE1"]} />);
  expect(screen.queryByText("Disciplina COURSE7")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar mais" }));
  expect(screen.getByText("Disciplina COURSE7")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }));
  expect(screen.queryByText("Disciplina COURSE7")).not.toBeInTheDocument();
  expect(
    screen.getByRole("list", { name: "Disciplinas em ordem de prioridade" })
  ).toHaveTextContent("Disciplina COURSE1");
  expect(screen.getByLabelText("Buscar disciplinas pendentes")).toHaveFocus();
});
