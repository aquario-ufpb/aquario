"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import NavBar from "@/components/shared/nav-bar";
import HamburgerMenu from "@/components/shared/hamburguer-menu";
import { SearchCommand } from "@/components/shared/search/search-command";
import { useAuth } from "@/contexts/auth-context";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { resolveSigaaAccessState } from "@/lib/client/sigaa/access-state";

export default function NavWrapper() {
  const [isDesktop, setIsDesktop] = useState(false);
  const auth = useAuth();
  const sigaaQuery = useOwnSigaaAcademicState(auth.isAuthenticated);
  const sigaaAccessState = resolveSigaaAccessState({
    isAuthenticated: auth.isAuthenticated,
    isAuthLoading: auth.isLoading,
    isConnectionLoading: sigaaQuery.isLoading,
    isConnectionError: sigaaQuery.isError,
    importedState: sigaaQuery.data,
  });
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  // Project detail pages: /projetos/[slug] (but NOT /projetos or /projetos/novo)
  const isProjetoDetail = /^\/projetos\/[^/]+$/.test(pathname) && pathname !== "/projetos/novo";
  const useStatic = isLandingPage || isProjetoDetail;

  useEffect(() => {
    // Function to check window size and update state
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    // Set initial value based on current window size
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Render the appropriate component based on screen size
  return (
    <>
      {isDesktop ? (
        <NavBar staticPosition={useStatic} sigaaAccessState={sigaaAccessState} />
      ) : (
        <HamburgerMenu sigaaAccessState={sigaaAccessState} />
      )}
      <SearchCommand />
    </>
  );
}
