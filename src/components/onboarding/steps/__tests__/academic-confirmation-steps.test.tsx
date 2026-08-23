import { fireEvent, render, screen } from "@testing-library/react";

import { ConcluidasStep } from "../concluidas-step";
import { CursandoStep } from "../cursando-step";

const marcar = jest.fn();
const suggestionsHook = jest.fn();

jest.mock("@/components/pages/grades-curriculares/curriculum-graph", () => ({
  CurriculumGraph: () => <div>Grade para confirmação</div>,
}));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({
  useCurrentUser: () => ({
    data: { curso: { id: "curso-1" }, permissoes: ["sigaa:beta"] },
  }),
}));
jest.mock("@/lib/client/hooks/use-grade-curricular", () => ({
  useGradeCurricular: () => ({
    data: {
      cursoNome: "Engenharia",
      curriculoCodigo: "2026",
      disciplinas: [],
    },
    isLoading: false,
  }),
}));
jest.mock("@/lib/client/hooks/use-disciplinas-concluidas", () => ({
  useDisciplinasConcluidas: () => ({ data: { disciplinaIds: ["d1"] } }),
}));
jest.mock("@/lib/client/hooks/use-disciplinas-semestre", () => ({
  useDisciplinasSemestreAtivo: () => ({ data: { disciplinas: [{ disciplinaId: "d2" }] } }),
  useMarcarDisciplinas: () => ({ mutateAsync: marcar, isPending: false }),
}));
jest.mock("@/lib/client/hooks/use-sigaa-onboarding-suggestions", () => ({
  useSigaaOnboardingSuggestions: (...args: unknown[]) => suggestionsHook(...args),
}));

const allSavedSuggestions = {
  hasSnapshot: true,
  isLoading: false,
  suggestions: {
    completed: {
      suggestedDisciplineIds: [],
      alreadySavedDisciplineIds: ["d1"],
      conflicts: [],
      unmatchedCodes: [],
    },
    enrolled: {
      suggestedDisciplineIds: [],
      alreadySavedDisciplineIds: ["d2"],
      conflicts: [],
      unmatchedCodes: [],
    },
    enrollmentSemester: "matched",
    ignoredEnrolledCodes: [],
  },
};

describe("academic onboarding confirmations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    suggestionsHook.mockReturnValue(allSavedSuggestions);
  });

  it("continues completed disciplines when every safe match is already saved", () => {
    const onComplete = jest.fn();
    render(<ConcluidasStep onComplete={onComplete} isMutating={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Tudo certo, continuar" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(marcar).not.toHaveBeenCalled();
  });

  it("opens current disciplines directly for a snapshot and continues without a write", () => {
    const onComplete = jest.fn();
    render(<CursandoStep onComplete={onComplete} isMutating={false} semestreNome="2026.1" />);

    expect(screen.getByText("Grade para confirmação")).toBeInTheDocument();
    expect(screen.queryByText(/Agora você vai selecionar/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tudo certo, continuar" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(marcar).not.toHaveBeenCalled();
  });

  it("preserves the introduction when there is no SIGAA snapshot", () => {
    suggestionsHook.mockReturnValue({ suggestions: null, hasSnapshot: false, isLoading: false });

    render(<CursandoStep onComplete={jest.fn()} isMutating={false} semestreNome="2026.1" />);

    expect(screen.getByText(/Agora você vai selecionar/)).toBeInTheDocument();
    expect(screen.queryByText("Grade para confirmação")).not.toBeInTheDocument();
  });
});
