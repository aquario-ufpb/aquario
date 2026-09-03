import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SigaaStep } from "../sigaa-step";

const invalidateQueries = jest.fn().mockResolvedValue(undefined);
const refetchQueries = jest.fn().mockResolvedValue(undefined);
const removeQueries = jest.fn();
const refetch = jest.fn().mockResolvedValue(undefined);
const mockUseSigaaState = jest.fn();

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ userId: "user-1" }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries, refetchQueries, removeQueries }),
}));

jest.mock("@/lib/client/hooks/use-sigaa", () => ({
  useOwnSigaaAcademicState: () => mockUseSigaaState(),
}));

jest.mock("@/components/sigaa/sigaa-connect-flow", () => ({
  SigaaConnectFlow: ({
    onSynchronized,
    onExit,
    exitLabel,
  }: {
    onSynchronized: (courseReplaced: boolean) => Promise<void>;
    onExit: () => void;
    exitLabel: string;
  }) => (
    <>
      <button
        onClick={async () => {
          await onSynchronized(false);
          onExit();
        }}
      >
        Sincronizar teste
      </button>
      <button onClick={onExit}>{exitLabel}</button>
    </>
  ),
}));

const payload = {
  identity: {
    matricula: "20260000001",
    sourceCourse: "Engenharia da Computação",
    sourceSemester: "2026.1",
  },
  curriculum: {
    components: [{ status: "completed" }, { status: "completed" }, { status: "enrolled" }],
  },
};

describe("SigaaStep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSigaaState.mockReturnValue({
      data: { connection: null, snapshot: null },
      isLoading: false,
      isError: false,
      refetch,
    });
  });

  it("oferece importação opcional e saída manual sem gravar ao carregar", () => {
    const onComplete = jest.fn();
    const onSkip = jest.fn();
    render(<SigaaStep onComplete={onComplete} onSkip={onSkip} isMutating={false} />);

    expect(screen.getByRole("button", { name: "Importar do SIGAA" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Prefiro configurar manualmente" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("anuncia a consulta enquanto carrega", () => {
    mockUseSigaaState.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch,
    });
    render(<SigaaStep onComplete={jest.fn()} onSkip={jest.fn()} isMutating={false} />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Consultando seus dados do SIGAA…")).toBeVisible();
  });

  it("exige confirmação explícita para usar um snapshot existente", async () => {
    const onComplete = jest.fn();
    mockUseSigaaState.mockReturnValue({
      data: { connection: { consentedAt: "2026-01-01" }, snapshot: { payload } },
      isLoading: false,
      isError: false,
      refetch,
    });
    render(<SigaaStep onComplete={onComplete} onSkip={jest.fn()} isMutating={false} />);

    expect(await screen.findByText("Seus dados já estão prontos")).toBeInTheDocument();
    expect(screen.getByText("Disciplinas concluídas encontradas")).toBeInTheDocument();
    expect(screen.getByText(/somente as correspondências seguras/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Usar estes dados" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("mostra sucesso após sincronizar e só então permite completar", async () => {
    const onComplete = jest.fn();
    render(<SigaaStep onComplete={onComplete} onSkip={jest.fn()} isMutating={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Importar do SIGAA" }));
    fireEvent.click(screen.getByRole("button", { name: "Sincronizar teste" }));

    expect(await screen.findByText("Dados importados com sucesso")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(refetchQueries).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Usar estes dados" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("sai do formulário direto para o fluxo manual uma única vez", async () => {
    const onSkip = jest.fn().mockResolvedValue(undefined);
    render(<SigaaStep onComplete={jest.fn()} onSkip={onSkip} isMutating={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Importar do SIGAA" }));
    const exit = screen.getByRole("button", { name: "Prefiro configurar manualmente" });
    fireEvent.click(exit);
    fireEvent.click(exit);

    await waitFor(() => expect(onSkip).toHaveBeenCalledTimes(1));
  });
});
