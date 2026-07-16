import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { OnboardingProgress } from "../onboarding-progress";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import type { GradeDisciplinaNode } from "@/lib/shared/types";

jest.mock("@/components/pages/grades-curriculares/graph-edges", () => ({
  GraphEdges: () => null,
}));

jest.mock("@/components/pages/grades-curriculares/discipline-detail-dialog", () => ({
  DisciplineDetailDialog: () => null,
}));

jest.mock("@/lib/client/grades-curriculares/export", () => ({
  exportGradeAsImage: jest.fn(),
}));

jest.mock("@/analytics/posthog-client", () => ({
  trackEvent: jest.fn(),
}));

const disciplina = {
  id: "node-1",
  disciplinaId: "disc-1",
  codigo: "INTRO01",
  nome: "Introdução à Computação",
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
} satisfies GradeDisciplinaNode;

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

describe("onboarding accessibility", () => {
  it("announces the current onboarding progress", () => {
    render(<OnboardingProgress currentStep={2} totalSteps={7} />);

    expect(screen.getByRole("progressbar", { name: "Progresso da configuração" })).toHaveAttribute(
      "aria-valuetext",
      "Passo 2 de 7"
    );
  });

  it("offers a semantic, vertical mobile curriculum selection", async () => {
    const onSaveWithStatus = jest.fn();

    render(
      <CurriculumGraph
        disciplinas={[disciplina]}
        cursoNome="Ciência da Computação"
        curriculoCodigo="2024.1"
        completedDisciplinaIds={new Set()}
        selectionMode
        onSaveWithStatus={onSaveWithStatus}
        allowedSaveStatuses={["concluida"]}
        mobileLayout="list"
      />
    );

    const mobileList = within(screen.getByTestId("mobile-curriculum-list"));
    const disciplineButton = mobileList.getByRole("button", {
      name: /Introdução à Computação/,
    });

    expect(disciplineButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(disciplineButton);
    expect(disciplineButton).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Salvar como Concluídas/ }));
      await Promise.resolve();
    });
    expect(onSaveWithStatus).toHaveBeenCalledWith(["disc-1"], "concluida");
  });
});
