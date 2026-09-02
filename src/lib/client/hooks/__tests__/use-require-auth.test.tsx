import { renderHook, waitFor } from "@testing-library/react";

import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";

import { useRequireAuth } from "../use-require-auth";

const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
jest.mock("@/contexts/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: jest.fn() }));

const mockUseAuth = jest.mocked(useAuth);
const mockUseCurrentUser = jest.mocked(useCurrentUser);

describe("useRequireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects a visitor even when the disabled user query reports loading", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      userId: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
    mockUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useCurrentUser>);

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.isLoading).toBe(false);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
