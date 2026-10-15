import { render, screen } from "@testing-library/react";
import { CalendarGridTable } from "../calendar-grid-table";
import { CalendarMobileView } from "../calendar-mobile-view";
import type { ClassWithRoom } from "../types";

const sunday: ClassWithRoom = {
  id: 1,
  codigo: "SUN101",
  nome: "Aula de domingo",
  turma: "01",
  horario: "1M12",
  docente: "",
  departamento: "",
  alunos: "",
  preferencias: [],
  pcd: 0,
  preAlocacao: null,
  paasRoomSolutionId: 0,
  room: { bloco: "", nome: "Sala 1" },
};

describe.each([
  ["weekly grid", CalendarGridTable],
  ["mobile list", CalendarMobileView],
] as const)("%s", (_name, Component) => {
  it("shows Sunday when occupied and keeps the following weekdays correctly named", () => {
    const monday = { ...sunday, id: 2, nome: "Aula de segunda", horario: "2M12" };
    render(<Component classes={[sunday, monday]} classColors={new Map()} isDark={false} />);
    expect(screen.getByText("Domingo")).toBeInTheDocument();
    expect(screen.getByText("Aula de domingo")).toBeInTheDocument();
    expect(screen.getByText("Segunda")).toBeInTheDocument();
    expect(screen.getByText("Aula de segunda")).toBeInTheDocument();
  });

  it("omits Sunday when no class occurs on that day", () => {
    render(
      <Component
        classes={[{ ...sunday, horario: "2M12" }]}
        classColors={new Map()}
        isDark={false}
      />
    );
    expect(screen.queryByText("Domingo")).not.toBeInTheDocument();
  });
});
