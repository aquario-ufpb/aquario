import { render, screen, waitFor } from "@testing-library/react";

import { OnboardingModal } from "../onboarding-modal";

jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/client/hooks", () => ({ useMyMemberships: () => ({ data: [] }) }));
jest.mock("../steps/sigaa-step", () => ({
  SigaaStep: () => (
    <div>
      <h2>Conectar ao SIGAA</h2>
      Fluxo SIGAA inline
    </div>
  ),
}));
jest.mock("../steps/welcome-step", () => ({ WelcomeStep: () => null }));
jest.mock("../steps/periodo-step", () => ({ PeriodoStep: () => null }));
jest.mock("../steps/concluidas-step", () => ({ ConcluidasStep: () => null }));
jest.mock("../steps/cursando-step", () => ({ CursandoStep: () => null }));
jest.mock("../steps/turmas-step", () => ({ TurmasStep: () => null }));
jest.mock("../steps/entidades-step", () => ({ EntidadesStep: () => null }));
jest.mock("../steps/done-step", () => ({ DoneStep: () => null }));

describe("OnboardingModal with SIGAA", () => {
  it("keeps the SIGAA flow inside the single onboarding dialog and focuses the step", async () => {
    const sigaaStep = {
      id: "sigaa" as const,
      title: "Conecte seu SIGAA",
      description: "Importe seus dados",
      isCompleted: false,
      isSkippable: true,
    };

    render(
      <OnboardingModal
        currentStep={sigaaStep}
        steps={[sigaaStep]}
        completedCount={1}
        totalCount={7}
        onComplete={jest.fn()}
        onSkip={jest.fn()}
        isMutating={false}
        paasAvailable={false}
      />
    );

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("Fluxo SIGAA inline")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Conectar ao SIGAA" })).toHaveFocus()
    );
  });
});
