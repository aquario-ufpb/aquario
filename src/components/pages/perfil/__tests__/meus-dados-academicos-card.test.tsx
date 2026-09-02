import { render, screen } from "@testing-library/react";

import type { SigaaImportedState } from "@/lib/client/api/sigaa";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";

import { MeusDadosAcademicosCard } from "../meus-dados-academicos-card";

const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));
jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/client/hooks/use-sigaa", () => ({ useOwnSigaaAcademicState: jest.fn() }));
jest.mock("../sigaa-connect-dialog", () => ({
  SigaaConnectDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Conectar ao SIGAA" /> : null,
}));
jest.mock("../sigaa-sensitive-action-dialog", () => ({
  SigaaSensitiveActionDialog: () => null,
}));

const mockUseSigaaState = jest.mocked(useOwnSigaaAcademicState);

const emptyState: SigaaImportedState = {
  matricula: { value: null, origin: null, verifiedAt: null },
  connection: null,
  snapshot: null,
};

const synchronizedState: SigaaImportedState = {
  matricula: {
    value: "20260000001",
    origin: "SIGAA",
    verifiedAt: "2026-08-22T12:00:00.000Z",
  },
  connection: {
    status: "CONNECTED",
    consentVersion: "sigaa-v1-2026-08",
    consentedAt: "2026-08-22T12:00:00.000Z",
    connectedAt: "2026-08-22T12:00:00.000Z",
    disconnectedAt: null,
  },
  snapshot: {
    contractVersion: "sigaa-v1",
    connectorObservedAt: "2026-08-22T12:00:00.000Z",
    synchronizedAt: "2026-08-22T12:00:00.000Z",
    upstreamCommit: "a".repeat(40),
    installedByRunId: null,
    payload: {
      identity: {
        matricula: "20260000001",
        sourceCourse: "Engenharia da Computação",
        sourceSemester: "2026.1",
      },
      curriculum: {
        code: "2026",
        maximumCompletionTerm: null,
        semesterWorkload: { minimum: null, maximum: null },
        cra: { value: "8.5", source: "academic_transcript" },
        progress: [
          {
            description: "Total",
            completedHours: 1800,
            totalHours: 3600,
            remainingHours: 1800,
            completedPercent: 50,
          },
        ],
        components: [],
      },
      grades: [],
      classes: [
        {
          sourceKey: "class-1",
          name: "Compiladores",
          code: "GDCO0001",
          room: "CI 101",
          scheduleRaw: "24M12",
          semester: "2026.1",
        },
        {
          sourceKey: "class-2",
          name: "Redes",
          code: "GDCO0002",
          room: "CI 102",
          scheduleRaw: "35M12",
          semester: "2026.1",
        },
      ],
    },
  },
};

const queryResult = (overrides: Record<string, unknown>) =>
  ({
    data: emptyState,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  }) as unknown as ReturnType<typeof useOwnSigaaAcademicState>;

describe("MeusDadosAcademicosCard", () => {
  it("mostra um esqueleto estruturado durante o carregamento", () => {
    mockUseSigaaState.mockReturnValue(queryResult({ isLoading: true, data: undefined }));

    render(<MeusDadosAcademicosCard usuarioId="user-1" />);

    expect(screen.getByLabelText("Carregando integração SIGAA")).toHaveAttribute(
      "data-ph-no-capture",
      "true"
    );
    expect(screen.queryByRole("button", { name: "Conectar ao SIGAA" })).not.toBeInTheDocument();
  });

  it("diferencia falha de carregamento do estado nunca conectado", () => {
    mockUseSigaaState.mockReturnValue(
      queryResult({ isError: true, data: undefined, refetch: jest.fn() })
    );

    render(<MeusDadosAcademicosCard usuarioId="user-1" />);

    expect(screen.getByText("Não foi possível carregar seus dados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    expect(screen.queryByText("CRA e progresso do curso")).not.toBeInTheDocument();
  });

  it("explica o benefício antes de pedir a conexão e credita os dois projetos", () => {
    mockUseSigaaState.mockReturnValue(queryResult({ data: emptyState }));

    render(<MeusDadosAcademicosCard usuarioId="user-1" />);

    expect(screen.getByText("CRA e progresso do curso")).toBeInTheDocument();
    expect(screen.getByText("Notas, resultados e faltas")).toBeInTheDocument();
    expect(screen.getByText("Turmas do período atual")).toBeInTheDocument();
    expect(screen.getByText(/senha é usada apenas durante a consulta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conectar ao SIGAA" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sigaa-for-ai-agents, de PucaVaz/i })).toHaveAttribute(
      "href",
      "https://github.com/PucaVaz/sigaa-for-ai-agents"
    );
    expect(screen.getByRole("link", { name: /aquario-sigaa-connector/i })).toHaveAttribute(
      "href",
      "https://github.com/aquario-ufpb/aquario-sigaa-connector"
    );
  });

  it("resume o snapshot e mantém a ação de abrir o painel como primária", () => {
    mockUseSigaaState.mockReturnValue(queryResult({ data: synchronizedState }));

    render(<MeusDadosAcademicosCard usuarioId="user-1" />);

    expect(screen.getByText("Sincronizado")).toBeInTheDocument();
    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Matrícula verificada: 20260000001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir painel acadêmico" })).toHaveAttribute(
      "href",
      "/me/academico"
    );
    expect(screen.getByRole("button", { name: "Sincronizar agora" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gerenciar/i })).toBeInTheDocument();
  });
});
