import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { CurriculumGraph } from "../curriculum-graph";
import type { GradeDisciplinaNode } from "@/lib/shared/types";

jest.mock("../graph-edges", () => ({
  GraphEdges: () => null,
}));

jest.mock("../discipline-detail-dialog", () => ({
  DisciplineDetailDialog: () => null,
}));

jest.mock("@/lib/client/grades-curriculares/export", () => ({
  exportGradeAsImage: jest.fn(),
}));

jest.mock("@/analytics/posthog-client", () => ({
  trackEvent: jest.fn(),
}));

function makeDisciplina(overrides: Partial<GradeDisciplinaNode>): GradeDisciplinaNode {
  return {
    id: "node",
    disciplinaId: "disc",
    codigo: "COD",
    nome: "Disciplina",
    periodo: 1,
    natureza: "OBRIGATORIA",
    preRequisitos: [],
    equivalencias: [],
    cargaHorariaTotal: 60,
    cargaHorariaTeoria: 60,
    cargaHorariaPratica: 0,
    departamento: "Departamento de Informática",
    modalidade: "PRESENCIAL",
    ementa: null,
    ...overrides,
  } satisfies GradeDisciplinaNode;
}

// Período 1: duas obrigatórias + uma optativa. Período 2: uma obrigatória.
const CALCULO = makeDisciplina({
  id: "n1",
  disciplinaId: "disc-calculo",
  codigo: "CALC1",
  nome: "Cálculo I",
});
const PROGRAMACAO = makeDisciplina({
  id: "n2",
  disciplinaId: "disc-programacao",
  codigo: "PROG1",
  nome: "Introdução à Programação",
});
const LIBRAS = makeDisciplina({
  id: "n3",
  disciplinaId: "disc-libras",
  codigo: "LIB1",
  nome: "Libras",
  natureza: "OPTATIVA",
});
const ESTRUTURAS = makeDisciplina({
  id: "n4",
  disciplinaId: "disc-estruturas",
  codigo: "EST1",
  nome: "Estruturas de Dados",
  periodo: 2,
});

const DISCIPLINAS = [CALCULO, PROGRAMACAO, LIBRAS, ESTRUTURAS];

const PERIODO_1_MARCAR = "Marcar todas as obrigatórias do 1º período";
const PERIODO_1_DESMARCAR = "Desmarcar todas as obrigatórias do 1º período";

function renderGraph(props: Partial<React.ComponentProps<typeof CurriculumGraph>> = {}) {
  return render(
    <CurriculumGraph
      disciplinas={DISCIPLINAS}
      cursoNome="Ciência da Computação"
      curriculoCodigo="001.112023"
      completedDisciplinaIds={new Set()}
      cursandoDisciplinaIds={new Set()}
      selectionMode
      isLoggedIn
      onSaveWithStatus={jest.fn()}
      {...props}
    />
  );
}

/** aria-pressed do card da disciplina no grafo (desktop) */
function selectionStateOf(nome: string): string | null {
  return screen.getByRole("button", { name: nome }).getAttribute("aria-pressed");
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe("CurriculumGraph — seleção por período", () => {
  it("seleciona todas as obrigatórias do período, sem tocar nas optativas", () => {
    renderGraph();

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    expect(selectionStateOf("Cálculo I")).toBe("true");
    expect(selectionStateOf("Introdução à Programação")).toBe("true");
    expect(selectionStateOf("Libras")).toBe("false");
    expect(selectionStateOf("Estruturas de Dados")).toBe("false");
  });

  it("inclui as disciplinas já concluídas na seleção", () => {
    renderGraph({ completedDisciplinaIds: new Set(["disc-calculo"]) });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    expect(selectionStateOf("Cálculo I")).toBe("true");
    expect(selectionStateOf("Introdução à Programação")).toBe("true");
  });

  it("salva as obrigatórias selecionadas em lote", async () => {
    const onSaveWithStatus = jest.fn();
    renderGraph({ onSaveWithStatus, allowedSaveStatuses: ["concluida"] });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Salvar como Concluídas \(2\)/ }));
      await Promise.resolve();
    });

    expect(onSaveWithStatus).toHaveBeenCalledWith(
      ["disc-calculo", "disc-programacao"],
      "concluida"
    );
  });

  it("tira as obrigatórias da seleção no segundo clique", () => {
    renderGraph();

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    // O cabeçalho passa a oferecer a ação inversa
    const desmarcar = screen.getByRole("button", { name: PERIODO_1_DESMARCAR });
    expect(desmarcar).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(desmarcar);

    expect(selectionStateOf("Cálculo I")).toBe("false");
    expect(selectionStateOf("Introdução à Programação")).toBe("false");
    expect(screen.getByRole("button", { name: PERIODO_1_MARCAR })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("mantém as obrigatórias de outros períodos ao desmarcar um período", () => {
    renderGraph();

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));
    fireEvent.click(
      screen.getByRole("button", { name: "Marcar todas as obrigatórias do 2º período" })
    );
    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_DESMARCAR }));

    expect(selectionStateOf("Cálculo I")).toBe("false");
    expect(selectionStateOf("Estruturas de Dados")).toBe("true");
  });

  it("desmarca também pela lista mobile", () => {
    renderGraph({ mobileLayout: "list" });

    const mobileList = within(screen.getByTestId("mobile-curriculum-list"));
    fireEvent.click(mobileList.getAllByRole("button", { name: "Marcar obrigatórias" })[0]);
    fireEvent.click(mobileList.getAllByRole("button", { name: "Desmarcar obrigatórias" })[0]);

    expect(mobileList.getByRole("button", { name: /Cálculo I/ }).getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("não transforma o cabeçalho do período em botão fora do modo seleção", () => {
    renderGraph({ selectionMode: false });

    expect(screen.queryByRole("button", { name: PERIODO_1_MARCAR })).not.toBeInTheDocument();
    expect(screen.getByText("1° Período")).toBeInTheDocument();
  });

  it("oferece a ação em lote também na lista mobile", () => {
    renderGraph({ mobileLayout: "list" });

    const mobileList = within(screen.getByTestId("mobile-curriculum-list"));
    fireEvent.click(mobileList.getAllByRole("button", { name: "Marcar obrigatórias" })[0]);

    expect(mobileList.getByRole("button", { name: /Cálculo I/ }).getAttribute("aria-pressed")).toBe(
      "true"
    );
  });
});

describe("CurriculumGraph — ações de salvar conforme a seleção", () => {
  it("oferece apenas Desmarcar quando tudo que está selecionado já é concluído", () => {
    renderGraph({
      completedDisciplinaIds: new Set(["disc-calculo", "disc-programacao"]),
    });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    expect(screen.getByRole("button", { name: /Desmarcar \(2\)/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Salvar/ })).not.toBeInTheDocument();
  });

  it("desmarca em lote a partir do botão direto", async () => {
    const onSaveWithStatus = jest.fn();
    renderGraph({
      completedDisciplinaIds: new Set(["disc-calculo", "disc-programacao"]),
      onSaveWithStatus,
    });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Desmarcar \(2\)/ }));
      await Promise.resolve();
    });

    expect(onSaveWithStatus).toHaveBeenCalledWith(["disc-calculo", "disc-programacao"], "none");
  });

  it("mantém o menu com várias opções quando a seleção é mista", () => {
    renderGraph({ completedDisciplinaIds: new Set(["disc-calculo"]) });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    // Mais de uma ação possível: continua sendo o dropdown genérico "Salvar"
    expect(screen.getByRole("button", { name: /Salvar \(2\)/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Desmarcar \(/ })).not.toBeInTheDocument();
  });

  it("desabilita o salvar quando a seleção não admite nenhuma ação permitida", () => {
    // Onboarding: só permite "concluida" e o usuário selecionou apenas concluídas
    renderGraph({
      allowedSaveStatuses: ["concluida"],
      completedDisciplinaIds: new Set(["disc-calculo", "disc-programacao"]),
    });

    fireEvent.click(screen.getByRole("button", { name: PERIODO_1_MARCAR }));

    expect(screen.getByRole("button", { name: /Salvar como Concluídas \(2\)/ })).toBeDisabled();
  });
});
