import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { trackEvent } from "@/analytics/posthog-client";
import { SIGAA_CONSENT_VERSION } from "@/lib/client/api/sigaa";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "@/lib/client/hooks/use-disciplinas-semestre";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";

import MeusDadosAcademicosPage from "../page";

const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));
jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/client/hooks/use-require-auth", () => ({ useRequireAuth: jest.fn() }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: jest.fn() }));
jest.mock("@/lib/client/hooks/use-sigaa", () => ({ useOwnSigaaAcademicState: jest.fn() }));
jest.mock("@/lib/client/hooks/use-grade-curricular", () => ({ useGradeCurricular: jest.fn() }));
jest.mock("@/lib/client/hooks/use-disciplinas-concluidas", () => ({
  useDisciplinasConcluidas: jest.fn(),
}));
jest.mock("@/lib/client/hooks/use-disciplinas-semestre", () => ({
  useDisciplinasSemestreAtivo: jest.fn(),
}));
jest.mock("@/components/pages/perfil/sigaa-connect-dialog", () => ({
  SigaaConnectDialog: ({ open, requireConsent }: { open: boolean; requireConsent: boolean }) =>
    open ? (
      <div role="dialog" aria-label="Sincronizar SIGAA" data-require-consent={requireConsent} />
    ) : null,
}));

const mockUseCurrentUser = jest.mocked(useCurrentUser);
const mockUseSigaaState = jest.mocked(useOwnSigaaAcademicState);
const mockUseGrade = jest.mocked(useGradeCurricular);
const mockUseCompleted = jest.mocked(useDisciplinasConcluidas);
const mockUseEnrolled = jest.mocked(useDisciplinasSemestreAtivo);
const mockTrackEvent = jest.mocked(trackEvent);

const currentUser = {
  id: "user-1",
  permissoes: ["sigaa:beta"],
  curso: { id: "course-1" },
};

const connection = (
  status: "PENDING" | "CONNECTED" | "DISCONNECTED",
  consentVersion: string | null
) => ({
  status,
  consentVersion,
  consentedAt: null,
  connectedAt: null,
  disconnectedAt: null,
});

const importedState = (options?: {
  status?: "PENDING" | "CONNECTED" | "DISCONNECTED";
  consentVersion?: string | null;
  withSnapshot?: boolean;
}) => ({
  matricula: {
    value: options?.withSnapshot ? "20260000001" : null,
    origin: options?.withSnapshot ? ("SIGAA" as const) : null,
    verifiedAt: options?.withSnapshot ? "2026-08-22T12:00:00.000Z" : null,
  },
  connection: options?.status ? connection(options.status, options.consentVersion ?? null) : null,
  snapshot: options?.withSnapshot
    ? {
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
            cra: { value: "8.5", source: "academic_transcript" as const },
            progress: [
              {
                description: "Total",
                completedHours: 120,
                totalHours: 240,
                remainingHours: 120,
                completedPercent: 50,
              },
              {
                description: "Complementar Flex\uFFFDvel",
                completedHours: 30,
                totalHours: 60,
                remainingHours: 30,
                completedPercent: 50,
              },
            ],
            components: [
              {
                code: "GDCO0001",
                name: "Introdução à Computação",
                integrationType: "DISCIPLINA",
                period: 0,
                workloadHours: 60,
                required: true,
                status: "completed" as const,
                prerequisite: null,
                corequisite: null,
              },
              {
                code: "GDCO0002",
                name: "Estruturas de Dados",
                integrationType: "DISCIPLINA",
                period: 1,
                workloadHours: 60,
                required: true,
                status: "enrolled" as const,
                prerequisite: null,
                corequisite: null,
              },
            ],
          },
          grades: [
            {
              semester: "2026.1",
              code: "GDCO0001",
              discipline: "Introdução à Computação",
              units: ["8,0", "9,0"],
              exam: null,
              result: "8,5",
              absences: "2",
              status: "Aprovado",
            },
            {
              semester: "2025.2",
              code: "GDCO0002",
              discipline: "Estruturas de Dados",
              units: ["4,9", "6,5"],
              exam: "4,0",
              result: "4,8",
              absences: "2",
              status: "REPROVADO",
            },
            {
              semester: "2025.1",
              code: "GDCO0003",
              discipline: "Cálculo",
              units: ["7,0"],
              exam: null,
              result: "7,0",
              absences: "26",
              status: "REP. FALTA",
            },
          ],
          classes: [
            {
              sourceKey: "class-1",
              name: "Estruturas de Dados",
              code: "GDCO0002",
              room: "CI-101",
              scheduleRaw: "2M12",
              semester: "2026.1",
            },
          ],
        },
      }
    : null,
});

const queryResult = (data: unknown) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
});

describe("MeusDadosAcademicosPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentUser.mockReturnValue(queryResult(currentUser) as never);
    mockUseSigaaState.mockReturnValue(queryResult(importedState()) as never);
    mockUseGrade.mockReturnValue(queryResult({ disciplinas: [] }) as never);
    mockUseCompleted.mockReturnValue(queryResult({ disciplinaIds: [], disciplinas: [] }) as never);
    mockUseEnrolled.mockReturnValue(queryResult({ disciplinas: [] }) as never);
  });

  it("shows a retryable profile error instead of claiming the beta is unavailable", async () => {
    const user = userEvent.setup();
    const refetch = jest.fn();
    mockUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<MeusDadosAcademicosPage />);

    expect(
      screen.getByRole("heading", { name: "Não foi possível carregar seu perfil" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Esta funcionalidade está em beta restrita.")
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("records a first connection without a contradictory sync-again event", async () => {
    const user = userEvent.setup();
    render(<MeusDadosAcademicosPage />);

    await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));

    expect(mockTrackEvent).toHaveBeenCalledWith("sigaa_connect_opened", {
      operation: "connect",
      consent_required: true,
    });
    expect(mockTrackEvent).not.toHaveBeenCalledWith("sigaa_sync_again_clicked", expect.anything());
    expect(screen.getByRole("dialog", { name: "Sincronizar SIGAA" })).toHaveAttribute(
      "data-require-consent",
      "true"
    );
  });

  it("derives reconnect copy, consent, and analytics from a disconnected state", async () => {
    const user = userEvent.setup();
    mockUseSigaaState.mockReturnValue(
      queryResult(
        importedState({ status: "DISCONNECTED", consentVersion: SIGAA_CONSENT_VERSION })
      ) as never
    );

    render(<MeusDadosAcademicosPage />);
    await user.click(screen.getByRole("button", { name: "Reconectar e sincronizar" }));

    expect(mockTrackEvent).toHaveBeenCalledWith("sigaa_connect_opened", {
      operation: "sync",
      consent_required: false,
    });
    expect(mockTrackEvent).toHaveBeenCalledWith("sigaa_sync_again_clicked", {
      connection_state: "disconnected",
    });
    expect(screen.getByRole("dialog", { name: "Sincronizar SIGAA" })).toHaveAttribute(
      "data-require-consent",
      "false"
    );
  });

  it("keeps current classes open and reveals accessible grade views on demand", async () => {
    const user = userEvent.setup();
    mockUseSigaaState.mockReturnValue(
      queryResult(
        importedState({
          status: "CONNECTED",
          consentVersion: SIGAA_CONSENT_VERSION,
          withSnapshot: true,
        })
      ) as never
    );

    render(<MeusDadosAcademicosPage />);

    expect(screen.getByRole("button", { name: /Turmas atuais/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("Segunda - Manhã (12)")).toBeInTheDocument();

    const gradesTrigger = screen.getByRole("button", { name: /Notas, resultados e faltas/ });
    expect(gradesTrigger).toHaveAttribute("aria-expanded", "false");
    await user.click(gradesTrigger);

    const mobileGrades = screen.getByRole("list", { name: "Notas do semestre 2026.1" });
    expect(mobileGrades).toHaveClass("sm:hidden");
    expect(screen.getByRole("table", { name: "Notas do semestre 2026.1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Faltas" })).toHaveAttribute("scope", "col");
  });

  it("defaults components to the trajectory and keeps no-period content closed", async () => {
    const user = userEvent.setup();
    mockUseSigaaState.mockReturnValue(
      queryResult(
        importedState({
          status: "CONNECTED",
          consentVersion: SIGAA_CONSENT_VERSION,
          withSnapshot: true,
        })
      ) as never
    );

    render(<MeusDadosAcademicosPage />);

    await user.click(screen.getByRole("button", { name: /Componentes curriculares/ }));

    expect(screen.getByRole("button", { name: /Minha trajetória 2/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const withoutPeriod = screen.getByRole("button", { name: /Sem período 1 componente/ });
    expect(withoutPeriod).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /1º período 1 componente/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await user.click(withoutPeriod);
    expect(screen.getAllByText("Obrigatória")[0]?.parentElement).toHaveClass("flex-wrap");
  });

  it("does not promote a partial progress category to total", () => {
    const state = importedState({
      status: "CONNECTED",
      consentVersion: SIGAA_CONSENT_VERSION,
      withSnapshot: true,
    });
    if (!state.snapshot) {
      throw new Error("Expected snapshot fixture");
    }
    state.snapshot.payload.curriculum.progress = [
      {
        description: "Complementar Obrigatoria",
        completedHours: 30,
        totalHours: 60,
        remainingHours: 30,
        completedPercent: 50,
      },
    ];
    mockUseSigaaState.mockReturnValue(queryResult(state) as never);

    render(<MeusDadosAcademicosPage />);

    expect(screen.getByText("Complementar Obrigatória")).toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Progresso total/)).not.toBeInTheDocument();
  });

  it("shows repaired progress labels, outcome statistics, and counted grade filters", async () => {
    const user = userEvent.setup();
    mockUseSigaaState.mockReturnValue(
      queryResult(
        importedState({
          status: "CONNECTED",
          consentVersion: SIGAA_CONSENT_VERSION,
          withSnapshot: true,
        })
      ) as never
    );

    render(<MeusDadosAcademicosPage />);

    expect(screen.getByText("Complementar Flexível")).toBeInTheDocument();
    expect(screen.queryByText("Complementar Flex\uFFFDvel")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Notas, resultados e faltas/ }));
    expect(screen.getByText("33,3%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprovadas 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reprovadas por nota 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reprovadas por falta 1" })).toBeInTheDocument();

    const newestSemester = screen.getByRole("button", { name: /2026\.1 1 componente/ });
    await user.click(newestSemester);
    expect(newestSemester).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Aprovadas 1" }));
    expect(screen.getByRole("button", { name: /2026\.1 1 componente/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});
