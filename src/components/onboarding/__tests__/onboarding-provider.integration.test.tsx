import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePathname } from "next/navigation";
import { useOnboarding } from "@/lib/client/hooks/use-onboarding";

import { OnboardingProvider } from "../onboarding-provider";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/lib/client/hooks/use-onboarding", () => ({ useOnboarding: vi.fn() }));
vi.mock("../onboarding-modal", () => ({
  OnboardingModal: () => <div role="dialog" aria-label="Configuração inicial" />,
}));

const mockUsePathname = vi.mocked(usePathname);
const mockUseOnboarding = vi.mocked(useOnboarding);

describe("OnboardingProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      shouldShow: true,
      currentStep: {
        id: "welcome",
        title: "Bem-vindo",
        description: "Configuração inicial",
        isSkippable: false,
        isCompleted: false,
      },
      steps: [],
      completedCount: 0,
      totalCount: 1,
      completeStep: vi.fn(),
      skipStep: vi.fn(),
      isMutating: false,
      semestreAtivo: undefined,
      paasAvailable: false,
      isComplete: false,
      isLoading: false,
    });
  });

  it.each(["/login", "/registro", "/esqueci-senha", "/resetar-senha", "/verificar-email"])(
    "does not mount onboarding on the auth route %s",
    pathname => {
      mockUsePathname.mockReturnValue(pathname);

      render(
        <OnboardingProvider>
          <div>Auth page</div>
        </OnboardingProvider>
      );

      expect(screen.getByText("Auth page")).toBeInTheDocument();
      expect(
        screen.queryByRole("dialog", { name: "Configuração inicial" })
      ).not.toBeInTheDocument();
    }
  );

  it("still mounts onboarding on the application home", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <OnboardingProvider>
        <div>Home</div>
      </OnboardingProvider>
    );

    expect(screen.getByRole("dialog", { name: "Configuração inicial" })).toBeInTheDocument();
  });
});
