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
jest.mock("../course-picker", () => ({
  CoursePicker: ({
    courses,
    value,
    onChange,
    label,
  }: {
    courses: { id: string; name: string }[];
    value: string;
    onChange: (id: string) => void;
    label: string;
  }) => (
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Escolha</option>
      {courses.map(course => (
        <option key={course.id} value={course.id}>
          {course.name}
        </option>
      ))}
    </select>
  ),
}));
jest.mock("../progress-settings", () => ({ ProgressSettings: () => null }));
jest.mock("../settings-editor", () => ({ SettingsEditor: () => null }));
jest.mock("../custom-offer-form", () => ({ CustomOfferForm: () => null }));
jest.mock("../offers-list", () => ({ OffersList: () => null }));
jest.mock("../goals-list", () => ({
  GoalsList: ({
    goals,
    onPriority,
  }: {
    goals: { code: string }[];
    onPriority: (code: string, priority: "exclude") => void;
  }) => (
    <div>
      {goals.map(goal => (
        <button key={goal.code} onClick={() => onPriority(goal.code, "exclude")}>
          Excluir {goal.code}
        </button>
      ))}
    </div>
  ),
}));
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

it("loads the selected course first, reads the other courses in cache batches, and never calls their portals automatically", async () => {
  renderWorkspace();
  const expand = await screen.findByRole("button", {
    name: "Buscar alternativas em outros cursos",
  });
  await waitFor(() => expect(expand).toBeEnabled());
  expect(plannerApi.offerings).toHaveBeenCalledWith("1", "2027.1", expect.any(AbortSignal), false);
  expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(2);
  expect(
    jest
      .mocked(plannerApi.offeringSnapshot)
      .mock.calls.every(([body]) => body.courseIds.length <= 200)
  ).toBe(true);
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
  expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(5);
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
  expect(plannerApi.offerings).not.toHaveBeenCalled();
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
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Buscar alternativas em outros cursos" })
      ).toBeEnabled()
    );
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

it("restores cached optional offers without fetching any other SIGAA portal", async () => {
  currentSnapshot = {
    ...snapshot,
    curriculum: {
      ...snapshot.curriculum,
      components: snapshot.curriculum.components.map(item =>
        item.code === "C2" ? { ...item, required: false, period: 0 } : item
      ),
    },
  };
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: body.courseIds.includes("2")
        ? [
            {
              ...ownResponse,
              course: courses[1],
              offers: [
                {
                  ...ownResponse.offers[0],
                  id: "optional",
                  code: "C2",
                  name: "Optativa",
                  reservations: { "2": 20 },
                },
              ],
            },
          ]
        : [],
      missingCourseIds: body.courseIds.filter(id => id !== "2"),
    })
  );
  renderWorkspace();
  await screen.findByText("2 turmas carregadas");
  expect(plannerApi.offeringBatch).not.toHaveBeenCalled();
  expect(plannerApi.offerings).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Incluir optativas para completar os mínimos")).toBeChecked();
  expect(
    screen.getByText(/Optativas do nível 0: 1 de 1 com turmas carregadas/)
  ).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Incluir optativas para completar os mínimos"));
  expect(screen.getByLabelText("Incluir optativas para completar os mínimos")).not.toBeChecked();
  expect(screen.getByText("2 turmas carregadas")).toBeInTheDocument();
  expect(plannerApi.offeringBatch).not.toHaveBeenCalled();
});

it("queries the explicitly selected course and includes optional codes even if another section is already loaded", async () => {
  currentSnapshot = {
    ...snapshot,
    curriculum: {
      ...snapshot.curriculum,
      components: snapshot.curriculum.components.map(item =>
        item.code === "C2" ? { ...item, required: false, period: 0 } : item
      ),
    },
  };
  renderWorkspace();
  const expand = await screen.findByRole("button", {
    name: "Buscar alternativas em outros cursos",
  });
  await waitFor(() => expect(expand).toBeEnabled());
  fireEvent.click(screen.getByText("Buscar optativas e outras turmas em um curso específico"));
  fireEvent.change(await screen.findByLabelText("Curso onde buscar outras turmas"), {
    target: { value: "205" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar neste curso" }));
  await waitFor(() => expect(plannerApi.offeringBatch).toHaveBeenCalledTimes(1));
  expect(jest.mocked(plannerApi.offeringBatch).mock.calls[0][0]).toEqual({
    semester: "2027.1",
    courseIds: ["205"],
    codes: ["C1", "C2"],
  });
  expect(plannerApi.offerings).toHaveBeenCalledWith("1", "2027.1", expect.any(AbortSignal), false);
});

it("spends broad-search budget only on uncached courses after warming the first twelve portals", async () => {
  const warm = new Set(Array.from({ length: 12 }, (_, i) => String(i + 2)));
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: body.courseIds
        .filter(id => warm.has(id))
        .map(id => ({ ...ownResponse, course: courses[Number(id) - 1], offers: [] })),
      missingCourseIds: body.courseIds.filter(id => !warm.has(id)),
    })
  );
  renderWorkspace();
  const expand = await screen.findByRole("button", {
    name: "Buscar alternativas em outros cursos",
  });
  await waitFor(() => expect(expand).toBeEnabled());
  fireEvent.click(expand);
  await waitFor(() => expect(plannerApi.offeringBatch).toHaveBeenCalledTimes(1));
  expect(jest.mocked(plannerApi.offeringBatch).mock.calls[0][0].courseIds).toEqual([
    "14",
    "15",
    "16",
    "17",
  ]);
  await screen.findByText(/8 consultas restantes nesta sessão/);
});

const cachedCourse = (id: string, offers = ownResponse.offers): OfferingResponse => ({
  ...ownResponse,
  course: courses[Number(id) - 1],
  offers,
});
const optionalOffer = {
  ...ownResponse.offers[0],
  id: "C2",
  code: "C2",
  name: "Optativa",
  reservations: { "205": 20 },
};

it("keeps cache hits free and shows the balance when every code already has an offering", async () => {
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: body.courseIds.includes("205") ? [cachedCourse("205", [optionalOffer])] : [],
      missingCourseIds: body.courseIds.filter(id => id !== "205"),
    })
  );
  renderWorkspace();
  await screen.findByText("2 turmas carregadas");
  fireEvent.click(screen.getByText("Buscar optativas e outras turmas em um curso específico"));
  fireEvent.change(await screen.findByLabelText("Curso onde buscar outras turmas"), {
    target: { value: "205" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar neste curso" }));
  expect(plannerApi.offeringBatch).not.toHaveBeenCalled();
  expect(screen.getByText(/Saldo de consultas SIGAA: 12 de 12/)).toBeInTheDocument();
  expect(screen.getByText(/Nenhuma consulta SIGAA foi gasta/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Atualizar este curso no SIGAA" }));
  await waitFor(() => expect(plannerApi.offeringBatch).toHaveBeenCalledTimes(1));
  expect(jest.mocked(plannerApi.offeringBatch).mock.calls[0][0].refresh).toBe(true);
  expect(screen.getByText(/Saldo de consultas SIGAA: 12 de 12/)).toBeInTheDocument();
});

it("explains a complete cache with no new portals instead of advertising an unusable broad search", async () => {
  jest.mocked(plannerApi.offeringSnapshot).mockResolvedValue({ results: [], missingCourseIds: [] });
  renderWorkspace();
  await screen.findByText(/Nenhum portal novo resta para a busca ampla/);
  expect(
    screen.getByRole("button", { name: "Buscar alternativas em outros cursos" })
  ).toBeDisabled();
  expect(screen.queryByText(/12 consultas restantes nesta sessão/)).not.toBeInTheDocument();
});

it("mounts the second course picker only while its panel is open", async () => {
  renderWorkspace();
  await screen.findByText("1 turmas carregadas");
  expect(screen.queryByLabelText("Curso onde buscar outras turmas")).not.toBeInTheDocument();
  const summary = screen.getByText("Buscar optativas e outras turmas em um curso específico");
  fireEvent.click(summary);
  await screen.findByLabelText("Curso onde buscar outras turmas");
  fireEvent.click(summary);
  await waitFor(() =>
    expect(screen.queryByLabelText("Curso onde buscar outras turmas")).not.toBeInTheDocument()
  );
});

it("preserves saved offers when the cache has already hydrated the current course", async () => {
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: body.courseIds.includes("205") ? [cachedCourse("205", [optionalOffer])] : [],
      missingCourseIds: body.courseIds.filter(id => id !== "205"),
    })
  );
  const saved: SavedPlan = {
    id: "saved",
    name: "Minhas turmas",
    semester: "2027.1",
    profileCourseId: "course",
    updatedAt: "2026-10-15T12:00:00Z",
    draft: { ...emptyDraft("2027.1"), courseId: "1", offers: ownResponse.offers },
  };
  jest.mocked(plannerApi.list).mockResolvedValue([saved]);
  jest.mocked(plannerApi.load).mockResolvedValue(saved);
  const workspace = renderWorkspace();
  await screen.findByText("2 turmas carregadas");
  fireEvent.click(screen.getByText("Salvar e carregar cenários"));
  fireEvent.click(await screen.findByRole("button", { name: "Carregar" }));
  await screen.findByText("1 turmas carregadas");
  workspace.update();
  expect(screen.getByText("1 turmas carregadas")).toBeInTheDocument();
});

it("keeps partial cache offers and retries only the failing batch", async () => {
  let failed = true;
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body => {
    if (body.courseIds.includes("205") && failed) {
      return Promise.reject(new Error("cache down"));
    }
    return Promise.resolve({
      results: body.courseIds.includes("2") ? [cachedCourse("2", [optionalOffer])] : [],
      missingCourseIds: [],
    });
  });
  renderWorkspace();
  await screen.findByText("2 turmas carregadas");
  await screen.findByText(/Parte dos lotes do cache não respondeu/);
  failed = false;
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(3));
  expect(jest.mocked(plannerApi.offeringSnapshot).mock.calls[2][0].courseIds).toEqual([
    "202",
    "203",
    "204",
    "205",
  ]);
  await waitFor(() =>
    expect(screen.queryByText(/Parte dos lotes do cache não respondeu/)).not.toBeInTheDocument()
  );
  expect(screen.getByText("2 turmas carregadas")).toBeInTheDocument();
  expect(plannerApi.offeringBatch).not.toHaveBeenCalled();
});

it("fits cached missing codes into the remaining capacity without discarding the draft", async () => {
  jest.mocked(plannerApi.offerings).mockResolvedValue({
    ...ownResponse,
    offers: Array.from({ length: 1499 }, (_, i) => ({
      ...ownResponse.offers[0],
      id: `own-${i}`,
    })),
  });
  jest.mocked(plannerApi.offeringSnapshot).mockImplementation(body =>
    Promise.resolve({
      results: body.courseIds.includes("205")
        ? [
            cachedCourse(
              "205",
              Array.from({ length: 3 }, (_, i) => ({ ...optionalOffer, id: `new-${i}` }))
            ),
          ]
        : [],
      missingCourseIds: body.courseIds.filter(id => id !== "205"),
    })
  );
  renderWorkspace();
  await screen.findByText("1500 turmas carregadas");
  expect(screen.getByText(/2 ofertas do cache ficaram de fora/)).toBeInTheDocument();
});

it("removes only explicitly excluded priorities from the cache query, keeping other level-zero electives", async () => {
  currentSnapshot = {
    ...snapshot,
    curriculum: {
      ...snapshot.curriculum,
      components: snapshot.curriculum.components.map(item => ({
        ...item,
        period: 0,
        required: false,
      })),
    },
  };
  renderWorkspace();
  const exclude = await screen.findByRole("button", { name: "Excluir C2" });
  await waitFor(() => expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(2));
  fireEvent.click(exclude);
  await waitFor(() => expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(4));
  for (const [body] of jest.mocked(plannerApi.offeringSnapshot).mock.calls.slice(2)) {
    expect(body.codes).toEqual(["C1"]);
  }
});
