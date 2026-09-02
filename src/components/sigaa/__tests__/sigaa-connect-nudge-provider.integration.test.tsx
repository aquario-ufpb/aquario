import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOnboarding } from "@/lib/client/hooks/use-onboarding";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { sigaaConnectNudgeStorageKey } from "@/lib/client/sigaa/connect-nudge";

import { SigaaConnectNudgeProvider } from "../sigaa-connect-nudge-provider";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/client/hooks/use-onboarding", () => ({ useOnboarding: vi.fn() }));
vi.mock("@/lib/client/hooks/use-sigaa", () => ({ useOwnSigaaAcademicState: vi.fn() }));
vi.mock("@/analytics/posthog-client", () => ({ trackEvent: vi.fn() }));

const mockUsePathname = vi.mocked(usePathname);
const mockUseAuth = vi.mocked(useAuth);
const mockUseOnboarding = vi.mocked(useOnboarding);
const mockUseSigaa = vi.mocked(useOwnSigaaAcademicState);

function stubReadyGates(pathname = "/") {
  mockUsePathname.mockReturnValue(pathname);
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    userId: "user-1",
    token: "token",
    login: vi.fn(),
    logout: vi.fn(),
  });
  mockUseOnboarding.mockReturnValue({
    shouldShow: false,
    isLoading: false,
    currentStep: null,
    steps: [],
    allSteps: [],
    completedCount: 0,
    totalCount: 0,
    completeStep: vi.fn(),
    skipStep: vi.fn(),
    isMutating: false,
    semestreAtivo: undefined,
    paasAvailable: false,
    isComplete: true,
  });
  mockUseSigaa.mockReturnValue({
    data: {
      matricula: { value: null, origin: null, verifiedAt: null },
      connection: null,
      snapshot: null,
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useOwnSigaaAcademicState>);
}

describe("SigaaConnectNudgeProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    stubReadyGates();
  });

  it("mounts the modal when every gate passes", async () => {
    render(<SigaaConnectNudgeProvider />);

    expect(await screen.findByRole("dialog", { name: "Conecte com o SIGAA" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Conectar agora" })).toHaveAttribute(
      "href",
      "/me/academico?connect=1"
    );
  });

  it.each(["/login", "/registro", "/esqueci-senha", "/resetar-senha", "/verificar-email"])(
    "does not mount on the auth route %s",
    async pathname => {
      stubReadyGates(pathname);
      render(<SigaaConnectNudgeProvider />);
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    }
  );

  it("does not mount on /me/academico", async () => {
    stubReadyGates("/me/academico");
    render(<SigaaConnectNudgeProvider />);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("does not mount while onboarding is open", async () => {
    stubReadyGates();
    mockUseOnboarding.mockReturnValue({
      shouldShow: true,
      isLoading: false,
      currentStep: {
        id: "welcome",
        title: "Bem-vindo",
        description: "Configuração inicial",
        isSkippable: false,
        isCompleted: false,
      },
      steps: [],
      allSteps: [],
      completedCount: 0,
      totalCount: 1,
      completeStep: vi.fn(),
      skipStep: vi.fn(),
      isMutating: false,
      semestreAtivo: undefined,
      paasAvailable: false,
      isComplete: false,
    });

    render(<SigaaConnectNudgeProvider />);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("does not remount after a stored dismissal", async () => {
    localStorage.setItem(
      sigaaConnectNudgeStorageKey("user-1"),
      JSON.stringify({ dismissedAt: "2026-09-02T12:00:00.000Z" })
    );
    render(<SigaaConnectNudgeProvider />);
    await expect(screen.findByRole("dialog", {}, { timeout: 150 })).rejects.toThrow();
  });

  it("persists dismiss per user and hides the modal", async () => {
    const user = userEvent.setup();
    render(<SigaaConnectNudgeProvider />);

    await user.click(await screen.findByRole("button", { name: "Deixar pra depois" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(sigaaConnectNudgeStorageKey("user-1"))).toEqual(
      expect.stringContaining("dismissedAt")
    );
  });
});
