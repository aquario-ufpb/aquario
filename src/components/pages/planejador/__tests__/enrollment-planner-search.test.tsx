import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnrollmentPlanner } from "../enrollment-planner";
import { plannerApi } from "@/lib/client/planner/api";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { usePlannerSolver } from "@/lib/client/planner/use-planner-solver";
import {
  emptyDraft,
  type OfferingResponse,
  type PlannerInput,
  type PlannerResult,
  type SavedPlan,
} from "@/lib/shared/planner/types";
import type { SigaaAcademicSnapshotPayload } from "@/lib/shared/types/sigaa-academic";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ userId: "student", token: "token" }),
}));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: () => ({}) }));
jest.mock("@/lib/client/hooks/use-sigaa", () => ({ useOwnSigaaAcademicState: jest.fn() }));
jest.mock("@/lib/client/hooks/use-disciplinas-concluidas", () => ({
  useDisciplinasConcluidas: () => ({}),
}));
jest.mock("@/lib/client/hooks/use-calendario-academico", () => ({
  useSemestres: () => ({ data: [{ nome: "2028.1" }] }),
}));
jest.mock("@/lib/client/planner/api", () => ({
  plannerApi: {
    courses: jest.fn(),
    list: jest.fn(),
    load: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    offerings: jest.fn(),
    offeringSnapshot: jest.fn(),
    offeringBatch: jest.fn(),
  },
}));
jest.mock("@/lib/client/planner/use-planner-solver", () => ({ usePlannerSolver: jest.fn() }));
jest.mock("../availability-editor", () => ({ AvailabilityEditor: () => null, selectClass: "" }));
jest.mock("../course-picker", () => ({ CoursePicker: () => null }));
jest.mock("../progress-settings", () => ({ ProgressSettings: () => null }));
jest.mock("../settings-editor", () => ({ SettingsEditor: () => null }));
jest.mock("../custom-offer-form", () => ({ CustomOfferForm: () => null }));
jest.mock("../offers-list", () => ({ OffersList: () => null }));
jest.mock("../goals-list", () => ({ GoalsList: () => null }));
jest.mock("../planner-results", () => ({ PlannerResults: () => null }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const courses = Array.from({ length: 205 }, (_, index) => ({
  id: String(index + 1),
  name: `Course ${index + 1}`,
  campus: "Campus",
  modality: "Presencial",
}));
const snapshot: SigaaAcademicSnapshotPayload = {
  identity: { matricula: "20260000001", sourceCourse: "Course 1", sourceSemester: "2026.2" },
  curriculum: {
    code: "2024",
    maximumCompletionTerm: null,
    semesterWorkload: { minimum: null, maximum: null },
    cra: { value: null, source: "unavailable" },
    progress: [],
    components: ["C1", "C2"].map(code => ({
      code,
      name: code,
      integrationType: "DISCIPLINA",
      period: 1,
      workloadHours: 60,
      required: true,
      status: "pending",
      prerequisite: null,
      corequisite: null,
    })),
  },
  grades: [],
  classes: [],
};
const ownResponse: OfferingResponse = {
  observedAt: "2026-10-15T12:00:00Z",
  course: courses[0],
  warnings: [],
  offers: [
    {
      id: "C1",
      code: "C1",
      name: "C1",
      section: "01",
      semester: "2027.1",
      schedule: "2M12",
      teacher: "",
      location: null,
      coordinates: null,
      source: "SIGAA",
      reservations: { "1": 20 },
      totalSeats: 20,
      availableSeats: 20,
      demand: 0,
      observedAt: "2026-10-15T12:00:00Z",
      sourceUrl: null,
    },
  ],
};
const result: PlannerResult = {
  solutions: [],
  exclusions: [],
  limited: false,
  explored: 1,
  message: "Resultado",
};
const solver = {
  result: null as PlannerResult | null,
  running: false,
  error: null,
  run: jest.fn<void, [PlannerInput, (() => void)?]>(),
  cancel: jest.fn(),
  invalidate: jest.fn(),
};
let currentSnapshot: SigaaAcademicSnapshotPayload | null;
function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => (
    <QueryClientProvider client={client}>
      <EnrollmentPlanner />
    </QueryClientProvider>
  );
  const rendered = render(tree());
  return { ...rendered, update: () => rendered.rerender(tree()) };
}
beforeEach(() => {
  jest.clearAllMocks();
  currentSnapshot = snapshot;
  solver.result = null;
  jest.mocked(usePlannerSolver).mockReturnValue(solver);
  jest.mocked(useOwnSigaaAcademicState).mockImplementation(
    () =>
      ({
        data: currentSnapshot ? { snapshot: { payload: currentSnapshot } } : undefined,
      }) as ReturnType<typeof useOwnSigaaAcademicState>
  );
  jest.mocked(plannerApi.courses).mockResolvedValue({ courses });
  jest.mocked(plannerApi.list).mockResolvedValue([]);
  jest.mocked(plannerApi.offerings).mockResolvedValue(ownResponse);
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: [],
      missingCourseIds: body.courseIds,
    })
  );
  jest.mocked(plannerApi.offeringBatch).mockResolvedValue({ results: [], failedCourseIds: [] });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true }),
  });
  Element.prototype.scrollIntoView = jest.fn();
});

it("loads the selected course first and never scans the other 204 courses automatically", async () => {
  renderWorkspace();
  const expand = await screen.findByRole("button", {
    name: "Buscar alternativas em outros cursos",
  });
  expect(expand).toBeEnabled();
  expect(plannerApi.offerings).toHaveBeenCalledWith("1", "2027.1", expect.any(AbortSignal), false);
  expect(plannerApi.offeringSnapshot).not.toHaveBeenCalled();
  expect(plannerApi.offeringBatch).not.toHaveBeenCalled();
});

it("expands only missing codes in batches of four courses and stops at twelve per session", async () => {
  renderWorkspace();
  const expand = await screen.findByRole("button", {
    name: "Buscar alternativas em outros cursos",
  });
  for (let count = 1; count <= 3; count++) {
    await waitFor(() => expect(expand).toBeEnabled());
    fireEvent.click(expand);
    await waitFor(() => expect(plannerApi.offeringBatch).toHaveBeenCalledTimes(count));
    await screen.findByText(new RegExp(`${12 - count * 4} consultas restantes nesta sessão`));
  }
  expect(expand).toBeDisabled();
  fireEvent.click(expand);
  expect(plannerApi.offeringBatch).toHaveBeenCalledTimes(3);
  const allIds = jest.mocked(plannerApi.offeringBatch).mock.calls.flatMap(([body]) => {
    expect(body.codes).toEqual(["C2"]);
    expect(body.semester).toBe("2027.1");
    expect(body.courseIds).toHaveLength(4);
    expect(body.courseIds).not.toContain("1");
    return body.courseIds;
  });
  expect(new Set(allIds).size).toBe(12);
  expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(3);
  expect(jest.mocked(plannerApi.offerings).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(plannerApi.offeringBatch).mock.invocationCallOrder[0]
  );
});

it("does not replace a semester selected before a delayed SIGAA snapshot arrives", async () => {
  currentSnapshot = null;
  const workspace = renderWorkspace();
  fireEvent.change(screen.getByLabelText("Semestre"), { target: { value: "2028.1" } });
  currentSnapshot = snapshot;
  workspace.update();
  await waitFor(() => expect(plannerApi.offerings).toHaveBeenCalled());
  expect(screen.getByLabelText("Semestre")).toHaveValue("2028.1");
});

it("preserves the loaded scenario semester when a delayed snapshot arrives", async () => {
  currentSnapshot = null;
  const saved: SavedPlan = {
    id: "saved",
    name: "Semestre escolhido",
    semester: "2028.1",
    profileCourseId: "course",
    updatedAt: "2026-10-15T12:00:00Z",
    draft: emptyDraft("2028.1"),
  };
  jest.mocked(plannerApi.list).mockResolvedValue([saved]);
  jest.mocked(plannerApi.load).mockResolvedValue(saved);
  const workspace = renderWorkspace();
  fireEvent.click(screen.getByText("Salvar e carregar cenários"));
  fireEvent.click(await screen.findByRole("button", { name: "Carregar" }));
  await waitFor(() => expect(screen.getByLabelText("Semestre")).toHaveValue("2028.1"));
  currentSnapshot = snapshot;
  workspace.update();
  await waitFor(() => expect(plannerApi.offerings).toHaveBeenCalled());
  expect(screen.getByLabelText("Semestre")).toHaveValue("2028.1");
});

it.each([true, false])(
  "uses coverage at worker completion rather than at calculation start (pending=%s)",
  async pendingAtCompletion => {
    let finishFetch: (value: OfferingResponse) => void = () => {
      throw new Error("Fetch did not start");
    };
    let finishSolver: () => void = () => {
      throw new Error("Solver did not start");
    };
    solver.run.mockImplementation((_input, callback) => {
      if (callback) {
        finishSolver = callback;
      }
    });
    const workspace = renderWorkspace();
    await screen.findByRole("button", { name: "Buscar alternativas em outros cursos" });
    jest.mocked(plannerApi.offerings).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishFetch = resolve;
        })
    );
    const calculate = () =>
      fireEvent.click(
        screen.getByRole("button", { name: /Encontrar combinações|Calcular com turmas carregadas/ })
      );
    if (pendingAtCompletion) {
      calculate();
    }
    fireEvent.click(screen.getByRole("button", { name: "Atualizar ofertas" }));
    await waitFor(() => expect(plannerApi.offerings).toHaveBeenCalledTimes(2));
    if (!pendingAtCompletion) {
      calculate();
      act(() => finishFetch(ownResponse));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Atualizar ofertas" })).toBeEnabled()
      );
    }
    act(() => {
      finishSolver();
      solver.result = result;
      workspace.update();
    });
    if (pendingAtCompletion) {
      act(() => finishFetch(ownResponse));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Atualizar ofertas" })).toBeEnabled()
      );
      expect(screen.getByText("Combinações com consulta parcial")).toBeInTheDocument();
    } else {
      expect(screen.queryByText("Combinações com consulta parcial")).not.toBeInTheDocument();
    }
  }
);
