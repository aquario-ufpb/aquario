import { render, screen } from "@testing-library/react";

import { PeriodoStep } from "../periodo-step";
import { usuariosService } from "@/lib/client/api/usuarios";

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ token: "token", userId: "user-1" }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({
  useCurrentUser: () => ({ data: { permissoes: [] } }),
}));
jest.mock("@/lib/client/hooks/use-sigaa", () => ({
  useOwnSigaaAcademicState: () => ({
    data: {
      snapshot: { payload: { identity: { sourceSemester: "2026.1" } } },
    },
  }),
}));
jest.mock("@/lib/client/api/usuarios", () => ({
  usuariosService: { updatePeriodoAtual: jest.fn() },
}));

describe("PeriodoStep with SIGAA snapshot", () => {
  it("explains the semester boundary without inferring or selecting a period", () => {
    render(<PeriodoStep onComplete={jest.fn()} isMutating={false} />);

    expect(screen.getByText(/SIGAA informou o semestre letivo/)).toHaveTextContent("2026.1");
    expect(screen.getByText(/não permite descobrir com segurança/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(usuariosService.updatePeriodoAtual).not.toHaveBeenCalled();
  });
});
