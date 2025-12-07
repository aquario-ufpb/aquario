import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

type RequireAuthOptions = {
  redirectTo?: string;
  requireRole?: "MASTER_ADMIN";
};

/**
 * Hook to require authentication for a page
 * Automatically redirects to login if not authenticated
 * Returns user and loading state
 *
 * @param options - Configuration options
 * @returns Object with user, isLoading, and isAuthenticated
 */
export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { redirectTo = "/login", requireRole } = options;
  const { user, isLoading, isAuthenticated, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      return;
    }

    // If there's a token but no user, the auth context's logout() is handling the redirect
    // Don't duplicate the redirect to avoid race conditions
    if (token && !user) {
      return;
    }

    // Only redirect if there's no token and no user (truly not authenticated)
    if (!token && !user) {
      router.replace(redirectTo);
      return;
    }

    // Check role requirement if specified
    if (requireRole && user && user.papelPlataforma !== requireRole) {
      router.replace("/");
    }
  }, [isLoading, token, user, router, redirectTo, requireRole]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
