import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "./use-usuarios";

type RequireAuthOptions = {
  redirectTo?: string;
  requireRole?: "MASTER_ADMIN";
};

/**
 * Hook to require authentication for a page.
 * Automatically redirects to login if not authenticated.
 *
 * For user data, use useCurrentUser() hook instead.
 *
 * @param options - Configuration options
 * @returns Object with isLoading and isAuthenticated
 */
export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { redirectTo = "/login", requireRole } = options;
  const { isLoading: authLoading, isAuthenticated, token } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();

  const isLoading = authLoading || userLoading;

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      return;
    }

    // If there's a token but no user data yet, wait for user to load
    if (token && !user) {
      return;
    }

    // Only redirect if there's no token (truly not authenticated)
    if (!token) {
      router.replace(redirectTo);
      return;
    }

    // Check role requirement if specified
    if (requireRole && user && user.papelPlataforma !== requireRole) {
      router.replace("/");
    }
  }, [isLoading, token, user, router, redirectTo, requireRole]);

  return {
    isLoading,
    isAuthenticated,
  };
}
