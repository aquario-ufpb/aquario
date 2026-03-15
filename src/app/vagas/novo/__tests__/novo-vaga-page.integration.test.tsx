/**
 * Integration tests for Nova Vaga page
 * Tests entity logo display in the dropdown selector
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import NovaVagaPage from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock hooks
vi.mock("@/lib/client/hooks/use-usuarios", () => ({
  useCurrentUser: vi.fn(),
  useMyMemberships: vi.fn(),
}));

vi.mock("@/lib/client/hooks/use-entidades", () => ({
  useEntidades: vi.fn(),
}));

// Mock vagasService
vi.mock("@/lib/client/api/vagas", () => ({
  vagasService: { create: vi.fn() },
}));

// Mock Avatar components — Radix Avatar doesn't render <img> in happy-dom
// because the image onload event never fires. Provide simple passthrough wrappers.
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="avatar" className={className}>
      {children}
    </span>
  ),
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="avatar-fallback" className={className}>
      {children}
    </span>
  ),
}));

// Import after mocking
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useEntidades } from "@/lib/client/hooks/use-entidades";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRouter = useRouter as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseCurrentUser = useCurrentUser as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseMyMemberships = useMyMemberships as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseEntidades = useEntidades as any;

describe("Nova Vaga Page — entity logos in dropdown", () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      refresh: mockRefresh,
    });
  });

  function setupMasterAdmin(entidades: Array<{ id: string; name: string; imagePath: string }>) {
    mockUseCurrentUser.mockReturnValue({
      data: { id: "u1", papelPlataforma: "MASTER_ADMIN" },
      isLoading: false,
    });
    mockUseMyMemberships.mockReturnValue({ data: [], isLoading: false });
    mockUseEntidades.mockReturnValue({ data: entidades, isLoading: false });
  }

  function setupRegularAdmin(
    memberships: Array<{
      entidade: { id: string; nome: string; urlFoto: string | null };
      papel: string;
      endedAt: string | null;
    }>
  ) {
    mockUseCurrentUser.mockReturnValue({
      data: { id: "u2", papelPlataforma: "USER" },
      isLoading: false,
    });
    mockUseMyMemberships.mockReturnValue({ data: memberships, isLoading: false });
    mockUseEntidades.mockReturnValue({ data: [], isLoading: false });
  }

  it("MASTER_ADMIN sees avatars with images in dropdown options", async () => {
    setupMasterAdmin([
      { id: "e1", name: "LabTech", imagePath: "/api/content-images/assets/entidades/labtech.png" },
      {
        id: "e2",
        name: "DataGroup",
        imagePath: "/api/content-images/assets/entidades/datagroup.png",
      },
    ]);

    render(<NovaVagaPage />);

    // Open the popover
    const trigger = screen.getByRole("button", { name: /selecione a entidade/i });
    await userEvent.click(trigger);

    // Check that avatar images exist in the dropdown options
    await waitFor(() => {
      const labImg = screen.getByAltText("LabTech");
      expect(labImg).toHaveAttribute("src", "/api/content-images/assets/entidades/labtech.png");

      const dataImg = screen.getByAltText("DataGroup");
      expect(dataImg).toHaveAttribute("src", "/api/content-images/assets/entidades/datagroup.png");
    });
  });

  it("selected entity shows avatar in trigger button", async () => {
    setupMasterAdmin([
      { id: "e1", name: "LabTech", imagePath: "/api/content-images/assets/entidades/labtech.png" },
      {
        id: "e2",
        name: "DataGroup",
        imagePath: "/api/content-images/assets/entidades/datagroup.png",
      },
    ]);

    render(<NovaVagaPage />);

    // Open the popover
    const trigger = screen.getByRole("button", { name: /selecione a entidade/i });
    await userEvent.click(trigger);

    // Select "LabTech"
    await waitFor(() => {
      expect(screen.getByText("LabTech")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("LabTech"));

    // The trigger should now show an avatar image for LabTech
    await waitFor(() => {
      const triggerButton = screen.getByRole("button", { name: /labtech/i });
      const img = within(triggerButton).getByAltText("LabTech");
      expect(img).toHaveAttribute("src", "/api/content-images/assets/entidades/labtech.png");
    });
  });

  it("entity without custom image shows fallback with name initial", async () => {
    setupMasterAdmin([
      {
        id: "e1",
        name: "Robolab",
        imagePath: "/api/content-images/assets/entidades/default.png",
      },
      {
        id: "e2",
        name: "SecondEntity",
        imagePath: "/api/content-images/assets/entidades/second.png",
      },
    ]);

    render(<NovaVagaPage />);

    // Open the popover (2 entities so no auto-select)
    const trigger = screen.getByRole("button", { name: /selecione a entidade/i });
    await userEvent.click(trigger);

    // The fallback should show the first letter of the name
    await waitFor(() => {
      expect(screen.getByText("R")).toBeInTheDocument();
    });
  });

  it("non-MASTER_ADMIN sees avatars from memberships with mapped urlFoto", async () => {
    setupRegularAdmin([
      {
        entidade: { id: "e1", nome: "MyEntity", urlFoto: "myentity.png" },
        papel: "ADMIN",
        endedAt: null,
      },
    ]);

    render(<NovaVagaPage />);

    // Since there's only one entity it's auto-selected, open to check dropdown option
    const trigger = screen.getByRole("button", { name: /myentity/i });
    await userEvent.click(trigger);

    // Two imgs: one in trigger (auto-selected), one in the dropdown option
    await waitFor(() => {
      const imgs = screen.getAllByAltText("MyEntity");
      expect(imgs.length).toBeGreaterThanOrEqual(2);
      for (const img of imgs) {
        expect(img).toHaveAttribute("src", "/api/content-images/assets/entidades/myentity.png");
      }
    });
  });
});
