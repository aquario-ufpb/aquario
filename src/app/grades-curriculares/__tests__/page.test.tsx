import { fireEvent, render, screen } from "@testing-library/react";
import GradesCurricularesPage from "../page";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";

jest.mock("@/contexts/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: jest.fn() }));
jest.mock("@/lib/client/hooks/use-grade-curricular", () => ({ useGradeCurricular: jest.fn() }));
jest.mock("@/lib/client/hooks/use-admin-cursos", () => ({
  useAllCursos: () => ({
    data: [
      { id: "cc", nome: "Ciência da Computação" },
      { id: "ec", nome: "Engenharia da Computação" },
    ],
  }),
}));
jest.mock("@/lib/client/hooks/use-calendario-academico", () => ({ useSemestreAtivo: () => ({}) }));
jest.mock("@/lib/client/hooks/use-disciplinas-concluidas", () => ({
  useDisciplinasConcluidas: () => ({}),
}));
jest.mock("@/lib/client/hooks/use-disciplinas-semestre", () => ({
  useDisciplinasSemestreAtivo: () => ({}),
  useMarcarDisciplinas: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/components/pages/grades-curriculares/curriculum-graph", () => ({
  CurriculumGraph: () => null,
}));
jest.mock("@/components/pages/grades-curriculares/curso-selector", () => ({
  CursoSelector: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button onClick={() => onSelect("cc")}>Escolher CC</button>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useGradeCurricular as jest.Mock).mockReturnValue({});
});

it("aguarda autenticação e perfil antes de escolher o curso do aluno", () => {
  (useAuth as jest.Mock).mockReturnValue({ isLoading: true, isAuthenticated: false });
  (useCurrentUser as jest.Mock).mockReturnValue({ isPending: true });
  const { rerender } = render(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith(null);
  (useAuth as jest.Mock).mockReturnValue({ isLoading: false, token: "session" });
  rerender(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith(null);
  // Restoring a token briefly precedes the authenticated user becoming available.
  (useAuth as jest.Mock).mockReturnValue({
    isLoading: false,
    isAuthenticated: false,
    token: "session",
  });
  rerender(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith(null);
  (useAuth as jest.Mock).mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    token: "session",
  });
  rerender(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith(null);
  (useCurrentUser as jest.Mock).mockReturnValue({
    isPending: false,
    data: { curso: { id: "ec" } },
  });
  rerender(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith("ec");
});

it("escolhe o primeiro curso para visitante sem aguardar a consulta desativada de perfil", () => {
  (useAuth as jest.Mock).mockReturnValue({ isLoading: false, isAuthenticated: false });
  (useCurrentUser as jest.Mock).mockReturnValue({ isPending: true });
  render(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith("cc");
});

it("preserva uma escolha manual enquanto o perfil está carregando", () => {
  (useAuth as jest.Mock).mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    token: "session",
  });
  (useCurrentUser as jest.Mock).mockReturnValue({ isPending: true });
  const { rerender } = render(<GradesCurricularesPage />);
  fireEvent.click(screen.getByRole("button", { name: "Escolher CC" }));
  (useCurrentUser as jest.Mock).mockReturnValue({
    isPending: false,
    data: { curso: { id: "ec" } },
  });
  rerender(<GradesCurricularesPage />);
  expect(useGradeCurricular).toHaveBeenLastCalledWith("cc");
});
