import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";

import HamburgerMenu from "../hamburguer-menu";

jest.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: jest.fn(), theme: "light", resolvedTheme: "light" }),
}));
jest.mock("@/contexts/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: jest.fn() }));

const mockUseAuth = jest.mocked(useAuth);
const mockUseCurrentUser = jest.mocked(useCurrentUser);

describe("HamburgerMenu", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      token: null,
      userId: null,
    });
    mockUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCurrentUser>);
  });

  it("exposes the disclosure state and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(<HamburgerMenu />);

    const trigger = screen.getByRole("button", { name: "Abrir menu de navegação" });
    expect(trigger).toHaveAttribute("aria-controls", "mobile-navigation-menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleName("Fechar menu de navegação");

    screen.getByRole("link", { name: "SOBRE" }).focus();
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("presents MCP as supporting information for the user benefit", () => {
    render(<HamburgerMenu />);

    expect(screen.getByText("SIGAA na sua IA")).toBeInTheDocument();
    expect(screen.getByText("MCP")).toBeInTheDocument();
    expect(screen.getByText("Use com Claude, ChatGPT e apps compatíveis.")).toBeInTheDocument();
  });
});
