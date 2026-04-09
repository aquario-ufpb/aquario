/**
 * Integration tests for useOnboarding hook
 * Tests the onboarding state machine: step ordering, conditional steps,
 * PAAS availability, semester-based logic, and step completion/skipping.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/utils/test-providers";
import type { OnboardingMetadata } from "@/lib/shared/types";

// Mock auth context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(() => ({
    token: "test-token",
    isAuthenticated: true,
    isLoading: false,
  })),
}));

// Mock child hooks
vi.mock("@/lib/client/hooks/use-usuarios", () => ({
  useCurrentUser: vi.fn(() => ({
    data: {
      id: "user-1",
      nome: "Test User",
      periodoAtual: null,
      centro: { sigla: "CI" },
    },
  })),
}));

vi.mock("@/lib/client/hooks/use-calendario-academico", () => ({
  useSemestreAtivo: vi.fn(() => ({
    data: {
      id: "sem-1",
      nome: "2025.1",
      dataInicio: "2025-01-01T00:00:00.000Z",
      dataFim: "2099-12-31T23:59:59.999Z",
    },
  })),
}));

vi.mock("@/lib/client/hooks/use-paas-calendar", () => ({
  usePaasCalendar: vi.fn(() => ({
    data: { description: "2025.1" },
  })),
}));

// Mock usuarios service
vi.mock("@/lib/client/api/usuarios", () => ({
  usuariosService: {
    getOnboardingMetadata: vi.fn(),
    updateOnboardingMetadata: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { useOnboarding } from "../use-onboarding";
import { usuariosService } from "@/lib/client/api/usuarios";
import { useCurrentUser } from "../use-usuarios";
import { useSemestreAtivo } from "../use-calendario-academico";
import { usePaasCalendar } from "../use-paas-calendar";

const mockGetMetadata = vi.mocked(usuariosService.getOnboardingMetadata);
const mockUpdateMetadata = vi.mocked(usuariosService.updateOnboardingMetadata);
const mockUseCurrentUser = vi.mocked(useCurrentUser);
const mockUseSemestreAtivo = vi.mocked(useSemestreAtivo);
const mockUsePaasCalendar = vi.mocked(usePaasCalendar);

function freshMetadata(overrides: Partial<OnboardingMetadata> = {}): OnboardingMetadata {
  return { ...overrides };
}

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset to default mocks
    mockUseCurrentUser.mockReturnValue({
      data: {
        id: "user-1",
        nome: "Test User",
        periodoAtual: null,
        centro: { sigla: "CI" },
      },
    } as ReturnType<typeof useCurrentUser>);

    mockUseSemestreAtivo.mockReturnValue({
      data: {
        id: "sem-1",
        nome: "2025.1",
        dataInicio: "2025-01-01T00:00:00.000Z",
        dataFim: "2099-12-31T23:59:59.999Z",
      },
    } as ReturnType<typeof useSemestreAtivo>);

    mockUsePaasCalendar.mockReturnValue({
      data: { description: "2025.1" },
    } as ReturnType<typeof usePaasCalendar>);
  });

  describe("step ordering and visibility", () => {
    it("shows all steps for a fresh user with active semester and PAAS", async () => {
      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isComplete).toBe(false);
      expect(result.current.shouldShow).toBe(true);

      // First step should be welcome
      expect(result.current.currentStep?.id).toBe("welcome");

      // Should have all 6 pending steps (turmas not shown until cursando is done)
      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).toContain("welcome");
      expect(stepIds).toContain("periodo");
      expect(stepIds).toContain("concluidas");
      expect(stepIds).toContain("cursando");
      expect(stepIds).toContain("entidades");
      expect(stepIds).toContain("done");
      // turmas NOT shown because cursando is not yet completed
      expect(stepIds).not.toContain("turmas");
    });

    it("shows turmas step when cursando is completed and PAAS is available", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { completedAt: "2025-01-01" },
        concluidas: { completedAt: "2025-01-01" },
        semesters: {
          "2025.1": { cursando: { completedAt: "2025-01-01" } },
        },
      });
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).toContain("turmas");
    });

    it("hides turmas step when PAAS is not available", async () => {
      mockUsePaasCalendar.mockReturnValue({
        data: { description: "2024.2" }, // different from semester
      } as ReturnType<typeof usePaasCalendar>);

      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        semesters: {
          "2025.1": { cursando: { completedAt: "2025-01-01" } },
        },
      });
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).not.toContain("turmas");
    });

    it("hides entire onboarding when in gray zone between semesters", async () => {
      mockUseSemestreAtivo.mockReturnValue({
        data: {
          id: "sem-2",
          nome: "2099.1",
          dataInicio: "2099-01-01T00:00:00.000Z",
          dataFim: "2099-06-30T23:59:59.999Z",
        },
      } as ReturnType<typeof useSemestreAtivo>);

      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShow).toBe(false);
    });

    it("hides cursando step when no active semester", async () => {
      mockUseSemestreAtivo.mockReturnValue({
        data: undefined,
      } as ReturnType<typeof useSemestreAtivo>);

      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).not.toContain("cursando");
      expect(stepIds).not.toContain("turmas");
    });
  });

  describe("periodo step auto-detection", () => {
    it("skips periodo step when user already has periodoAtual set", async () => {
      mockUseCurrentUser.mockReturnValue({
        data: {
          id: "user-1",
          nome: "Test User",
          periodoAtual: "5",
          centro: { sigla: "CI" },
        },
      } as ReturnType<typeof useCurrentUser>);

      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // periodo should not appear in pending steps
      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).not.toContain("periodo");
    });

    it("shows periodo step when user has no periodoAtual", async () => {
      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stepIds = result.current.steps.map(s => s.id);
      expect(stepIds).toContain("periodo");
    });
  });

  describe("completion tracking", () => {
    it("reports isComplete when all steps are done", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { completedAt: "2025-01-01" },
        concluidas: { completedAt: "2025-01-01" },
        entidades: { completedAt: "2025-01-01" },
        done: { completedAt: "2025-01-01" },
        semesters: {
          "2025.1": {
            cursando: { completedAt: "2025-01-01" },
            turmas: { completedAt: "2025-01-01" },
          },
        },
      });
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.shouldShow).toBe(false);
      expect(result.current.currentStep).toBeNull();
      expect(result.current.steps).toHaveLength(0);
    });

    it("tracks completedCount and totalCount correctly", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { completedAt: "2025-01-01" },
      });
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.completedCount).toBe(2);
      // Total includes: welcome, periodo, concluidas, cursando, entidades, done = 6
      // (turmas excluded since cursando not done)
      expect(result.current.totalCount).toBe(6);
    });

    it("counts skipped steps as completed", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { skippedAt: "2025-01-01" },
        concluidas: { skippedAt: "2025-01-01" },
      });
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.completedCount).toBe(3);
    });
  });

  describe("step completion mutations", () => {
    it("completes a one-time step", async () => {
      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);
      mockUpdateMetadata.mockResolvedValue({
        ...meta,
        welcome: { completedAt: "2025-01-01" },
      });

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.completeStep("welcome");

      expect(mockUpdateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          welcome: { completedAt: expect.any(String) },
        }),
        "test-token"
      );
    });

    it("completes a per-semester step with semester name", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { completedAt: "2025-01-01" },
        concluidas: { completedAt: "2025-01-01" },
      });
      mockGetMetadata.mockResolvedValue(meta);
      mockUpdateMetadata.mockResolvedValue({
        ...meta,
        semesters: { "2025.1": { cursando: { completedAt: "2025-01-01" } } },
      });

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.completeStep("cursando");

      expect(mockUpdateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          semesters: {
            "2025.1": { cursando: { completedAt: expect.any(String) } },
          },
        }),
        "test-token"
      );
    });
  });

  describe("step skipping", () => {
    it("skips a skippable step", async () => {
      const meta = freshMetadata({ welcome: { completedAt: "2025-01-01" } });
      mockGetMetadata.mockResolvedValue(meta);
      mockUpdateMetadata.mockResolvedValue({
        ...meta,
        periodo: { skippedAt: "2025-01-01" },
      });

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.skipStep("periodo");

      expect(mockUpdateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          periodo: { skippedAt: expect.any(String) },
        }),
        "test-token"
      );
    });

    it("skips a per-semester step", async () => {
      const meta = freshMetadata({
        welcome: { completedAt: "2025-01-01" },
        periodo: { completedAt: "2025-01-01" },
        concluidas: { completedAt: "2025-01-01" },
      });
      mockGetMetadata.mockResolvedValue(meta);
      mockUpdateMetadata.mockResolvedValue({
        ...meta,
        semesters: { "2025.1": { cursando: { skippedAt: "2025-01-01" } } },
      });

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.skipStep("cursando");

      expect(mockUpdateMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          semesters: {
            "2025.1": { cursando: { skippedAt: expect.any(String) } },
          },
        }),
        "test-token"
      );
    });
  });

  describe("PAAS availability", () => {
    it("paasAvailable is true when PAAS semester matches DB semester", async () => {
      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.paasAvailable).toBe(true);
    });

    it("paasAvailable is false when PAAS semester differs from DB semester", async () => {
      mockUsePaasCalendar.mockReturnValue({
        data: { description: "2024.2" },
      } as ReturnType<typeof usePaasCalendar>);

      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.paasAvailable).toBe(false);
    });

    it("paasAvailable is false when PAAS data is not loaded", async () => {
      mockUsePaasCalendar.mockReturnValue({
        data: undefined,
      } as ReturnType<typeof usePaasCalendar>);

      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.paasAvailable).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns isComplete true when no metadata exists", async () => {
      mockGetMetadata.mockResolvedValue(null as unknown as OnboardingMetadata);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When metadata is null, hook treats onboarding as complete
      expect(result.current.isComplete).toBe(true);
      expect(result.current.shouldShow).toBe(false);
    });

    it("step definitions have correct skippable flags", async () => {
      const meta = freshMetadata();
      mockGetMetadata.mockResolvedValue(meta);

      const { result } = renderHookWithProviders(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const welcomeStep = result.current.steps.find(s => s.id === "welcome");
      const periodoStep = result.current.steps.find(s => s.id === "periodo");
      const doneStep = result.current.steps.find(s => s.id === "done");

      expect(welcomeStep?.isSkippable).toBe(false);
      expect(periodoStep?.isSkippable).toBe(true);
      expect(doneStep?.isSkippable).toBe(false);
    });
  });
});
