import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ManualScheduleForm } from "../manual-schedule-form";
import { toast } from "sonner";

const mutateAsync = jest.fn();
jest.mock("@/lib/client/hooks/use-disciplinas-semestre", () => ({
  usePatchDisciplinaSemestre: () => ({ mutateAsync, isPending: false }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const discipline = {
  id: "extra-enrollment",
  disciplinaId: "edo",
  disciplinaCodigo: "1103180",
  disciplinaNome: "Séries e EDO",
  turma: null,
  docente: null,
  horario: null,
  codigoPaas: null,
  criadoEm: "2026-10-14T00:00:00Z",
};

beforeEach(() => jest.clearAllMocks());

it("saves an extraordinary turma without linking it to a local PAAS id", async () => {
  mutateAsync.mockResolvedValue({});
  render(<ManualScheduleForm discipline={discipline} />);
  fireEvent.click(screen.getByText("Informar turma de outra oferta ou horário manual"));
  fireEvent.change(screen.getByLabelText("Turma"), { target: { value: "03" } });
  fireEvent.change(screen.getByLabelText("Horário do SIGAA"), { target: { value: "2t34 4m12" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar horário" }));
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      disciplinaSemestreId: "extra-enrollment",
      data: { turma: "03", horario: "2T34 4M12", docente: null, codigoPaas: null },
    })
  );
});

it("keeps an unknown schedule out of the save request", () => {
  render(
    <ManualScheduleForm discipline={{ ...discipline, turma: "03", horario: "2M12 a definir" }} />
  );
  fireEvent.click(screen.getByRole("button", { name: "Salvar horário", hidden: true }));
  expect(mutateAsync).not.toHaveBeenCalled();
  expect(toast.error).toHaveBeenCalled();
});
