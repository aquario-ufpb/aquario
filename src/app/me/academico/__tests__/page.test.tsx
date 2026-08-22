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
            progress: [],
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
          ],
          classes: [],
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

  it("renders accessible mobile grade cards and a labeled desktop table", () => {
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

    const mobileGrades = screen.getByRole("list", { name: "Notas do semestre 2026.1" });
    expect(mobileGrades).toHaveClass("sm:hidden");
    expect(screen.getByRole("table", { name: "Notas do semestre 2026.1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Faltas" })).toHaveAttribute("scope", "col");
  });

  it("groups period zero consistently and lets component badges wrap", () => {
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

    expect(screen.getByRole("heading", { name: "0º período" })).toBeInTheDocument();
    expect(screen.getByText("Obrigatória").parentElement).toHaveClass("flex-wrap");
  });
});
