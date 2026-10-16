import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnrollmentPlanner } from "../enrollment-planner";
import { plannerApi } from "@/lib/client/planner/api";
import { emptyDraft, type SavedPlan } from "@/lib/shared/planner/types";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ userId: "student", token: "token" }),
}));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: () => ({}) }));
jest.mock("@/lib/client/hooks/use-sigaa", () => ({ useOwnSigaaAcademicState: () => ({}) }));
jest.mock("@/lib/client/hooks/use-disciplinas-concluidas", () => ({
  useDisciplinasConcluidas: () => ({}),
}));
jest.mock("@/lib/client/hooks/use-calendario-academico", () => ({
  useSemestres: () => ({ data: [] }),
}));
jest.mock("@/lib/client/planner/api", () => ({
  plannerApi: {
    courses: jest.fn(),
    list: jest.fn(),
    load: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  },
}));
jest.mock("@/lib/client/planner/use-planner-solver", () => ({
  usePlannerSolver: () => ({ invalidate: jest.fn() }),
}));
jest.mock("../availability-editor", () => ({ AvailabilityEditor: () => null, selectClass: "" }));
jest.mock("../course-picker", () => ({ CoursePicker: () => null }));
jest.mock("../progress-settings", () => ({ ProgressSettings: () => null }));
jest.mock("../settings-editor", () => ({ SettingsEditor: () => null }));
jest.mock("../custom-offer-form", () => ({ CustomOfferForm: () => null }));
jest.mock("../offers-list", () => ({ OffersList: () => null }));
jest.mock("../goals-list", () => ({ GoalsList: () => null }));
jest.mock("../planner-results", () => ({ PlannerResults: () => null }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const plan = (id: string): SavedPlan => ({
  id,
  name: `Cenário ${id}`,
  semester: "2026.2",
  profileCourseId: "course",
  updatedAt: "2026-10-15T12:00:00.000Z",
  draft: emptyDraft("2026.2"),
});
const a = plan("A"),
  b = plan("B");
const loadButton = (name: string) => {
  const row = screen.getByText(new RegExp(`^Cenário ${name} ·`)).closest("li");
  if (!row) {
    throw new Error(`Missing scenario row: ${name}`);
  }
  return within(row).getByRole("button", { name: "Carregar" });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(plannerApi.courses).mockResolvedValue({ courses: [] });
  jest.mocked(plannerApi.list).mockResolvedValue([a, b]);
  jest.mocked(plannerApi.load).mockImplementation(id => Promise.resolve(id === "A" ? a : b));
});

it("keeps scenario identity stable while a save is pending", async () => {
  let finishSave!: (value: SavedPlan) => void;
  jest.mocked(plannerApi.save).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishSave = resolve;
      })
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EnrollmentPlanner />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByText("Salvar e carregar cenários"));
  await screen.findByText(/^Cenário A ·/);
  fireEvent.click(loadButton("A"));
  await waitFor(() => expect(screen.getByLabelText("Nome do cenário")).toHaveValue("Cenário A"));
  fireEvent.click(screen.getByRole("button", { name: "Atualizar cenário" }));
  await waitFor(() => expect(plannerApi.save).toHaveBeenCalledTimes(1));
  expect(loadButton("B")).toBeDisabled();
  expect(screen.getByLabelText("Semestre")).toBeDisabled();
  for (const button of screen.getAllByRole("button", { name: "Excluir" })) {
    expect(button).toBeDisabled();
  }
  fireEvent.click(loadButton("B"));
  expect(plannerApi.load).toHaveBeenCalledTimes(1);
  act(() => finishSave({ ...a, updatedAt: "2026-10-15T13:00:00.000Z" }));
  await waitFor(() => expect(loadButton("B")).toBeEnabled());
  fireEvent.click(loadButton("B"));
  await waitFor(() => expect(screen.getByLabelText("Nome do cenário")).toHaveValue("Cenário B"));
  jest.mocked(plannerApi.save).mockResolvedValueOnce(b);
  fireEvent.click(screen.getByRole("button", { name: "Atualizar cenário" }));
  await waitFor(() => expect(plannerApi.save).toHaveBeenLastCalledWith("Cenário B", b.draft, b));
  client.clear();
});
