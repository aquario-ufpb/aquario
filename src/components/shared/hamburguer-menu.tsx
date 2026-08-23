"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Bot, ExternalLink, User, LogOut, Settings, Search } from "lucide-react";
import { SigaaMcpLink } from "@/components/shared/sigaa-mcp-link";
import { SigaaMenuStatus } from "@/components/shared/sigaa-menu-status";

// ============================================================================
// Helper Functions
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// Sub-components
// ============================================================================

function NavLogo() {
  return (
    <Link href="/">
      <Image
        className="w-20 dark:hidden"
        src="/logo2.png"
        width={75}
        height={75}
        alt="Aquario's logo"
      />
      <Image
        className="w-20 hidden dark:block"
        src="/logo3.png"
        width={75}
        height={75}
        alt="Aquario's logo"
      />
    </Link>
  );
}

type HamburgerIconProps = {
  isOpen: boolean;
  onClick: () => void;
  triggerRef: RefObject<HTMLButtonElement>;
};

function HamburgerIcon({ isOpen, onClick, triggerRef }: HamburgerIconProps) {
  const lineClass = "block w-6 h-0.5 bg-neutral-800 dark:bg-neutral-50";

  return (
    <button
      ref={triggerRef}
      className="flex min-h-11 min-w-11 flex-col items-center justify-center space-y-2 rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      aria-controls="mobile-navigation-menu"
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
    >
      <span
        className={`${lineClass} transition-transform duration-300 ease-in-out ${
          isOpen ? "rotate-45 translate-y-2.5" : ""
        }`}
      />
      <span
        className={`${lineClass} transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`${lineClass} transition-transform duration-300 ease-in-out ${
          isOpen ? "-rotate-45 -translate-y-2.5" : ""
        }`}
      />
    </button>
  );
}

type MenuLinkProps = {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

function MenuLink({ href, onClick, children, className = "" }: MenuLinkProps) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`flex min-h-11 items-center text-sm font-medium text-neutral-800 transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-blue-400 ${className}`}
      >
        {children}
      </Link>
    </li>
  );
}

type ThemeToggleProps = {
  isDark: boolean;
  mounted: boolean;
  onToggle: () => void;
};

function ThemeToggle({ isDark, mounted, onToggle }: ThemeToggleProps) {
  if (!mounted) {
    return (
      <li className="pt-2 border-t border-border/50">
        <div className="flex min-h-11 w-full items-center justify-between text-sm font-medium text-neutral-800 dark:text-neutral-200">
          <span>Tema</span>
          <div className="w-12 h-6 rounded-full bg-neutral-300 animate-pulse" />
        </div>
      </li>
    );
  }

  return (
    <li className="pt-2 border-t border-border/50">
      <button
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between text-sm font-medium text-neutral-800 transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-blue-400"
      >
        <span>Tema</span>
        <div className="relative">
          <div
            className={`w-12 h-6 rounded-full transition-colors duration-200 ${
              isDark ? "bg-blue-500" : "bg-neutral-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                isDark ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </button>
    </li>
  );
}

type UserSectionProps = {
  onClose: () => void;
};

function UserSection({ onClose }: UserSectionProps) {
  const { isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <li className="pt-2 border-t border-border/50">
        <Link
          href="/login"
          onClick={onClose}
          className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors block py-2"
        >
          Entrar
        </Link>
      </li>
    );
  }

  return (
    <>
      {/* User Info */}
      <li className="pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.urlFotoPerfil || getDefaultAvatarUrl(user.id, user.nome)}
              alt={user.nome}
            />
            <AvatarFallback className="text-xs">{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
              {user.nome}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{user.email}</p>
          </div>
        </div>
      </li>

      {/* Profile Link */}
      <li>
        <Link
          href="/perfil"
          onClick={onClose}
          className="flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-800 transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-blue-400"
        >
          <User className="h-4 w-4" />
          <span>Perfil</span>
        </Link>
      </li>

      {user.permissoes.includes("sigaa:beta") && (
        <li>
          <SigaaMenuStatus location="mobile_user_menu" onNavigate={onClose} variant="mobile" />
        </li>
      )}

      {/* Admin Link */}
      {user.papelPlataforma === "MASTER_ADMIN" && (
        <li>
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-800 transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-blue-400"
          >
            <Settings className="h-4 w-4" />
            <span>Administração</span>
          </Link>
        </li>
      )}

      {/* Logout */}
      <li>
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex min-h-11 w-full items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-red-400 dark:hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </li>
    </>
  );
}

// ============================================================================
// Navigation Links Data
// ============================================================================

const NAV_LINKS = [
  { href: "/sobre", label: "SOBRE" },
  { href: "/recursos", label: "RECURSOS" },
  { href: "/calendario", label: "DISCIPLINAS" },
  { href: "/grades-curriculares", label: "GRADES" },
  { href: "/mapas", label: "MAPAS" },
  { href: "/guias", label: "GUIAS" },
  { href: "/entidades", label: "ENTIDADES" },
  { href: "/projetos", label: "PROJETOS" },
] as const;

// ============================================================================
// Main Component
// ============================================================================

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { setTheme, theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(prev => !prev);
  const isDark = mounted && (resolvedTheme || theme) === "dark";

  return (
    <nav className="fixed w-full text-light-text flex justify-between flex-col h-[60px] bg-white dark:bg-black z-50 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        <NavLogo />

        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "k",
                    ctrlKey: true,
                    bubbles: true,
                  })
                );
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-50"
              aria-label="Pesquisar"
            >
              <Search className="w-5 h-5" />
            </button>
            <HamburgerIcon isOpen={isOpen} onClick={toggleMenu} triggerRef={triggerRef} />
          </div>

          {/* Dropdown Menu */}
          <div
            id="mobile-navigation-menu"
            className={`absolute right-0 top-full mt-2 max-h-[calc(100dvh-5rem)] min-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-lg border border-border/50 bg-white shadow-lg transition-opacity duration-200 ease-out motion-reduce:transition-none dark:bg-neutral-800 ${
              isOpen ? "opacity-100 visible z-50" : "opacity-0 invisible pointer-events-none"
            }`}
          >
            <ul className="flex flex-col p-4 space-y-3">
              {/* Navigation Links */}
              {NAV_LINKS.map(link => (
                <MenuLink key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </MenuLink>
              ))}

              <li>
                <SigaaMcpLink
                  location="mobile_menu"
                  className="flex min-h-11 items-center gap-2 rounded-md py-2 text-sm font-medium text-neutral-800 transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-blue-400"
                >
                  <Bot className="h-4 w-4" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span>SIGAA na sua IA</span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aquario-primary dark:bg-sky-950 dark:text-sky-200">
                        MCP
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground">
                      Use com Claude, ChatGPT e apps compatíveis.
                    </span>
                  </span>
                  <ExternalLink
                    className="ml-auto h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </SigaaMcpLink>
              </li>

              {/* User Section */}
              <UserSection onClose={closeMenu} />

              {/* Theme Toggle */}
              <ThemeToggle
                isDark={isDark}
                mounted={mounted}
                onToggle={() => setTheme(isDark ? "light" : "dark")}
              />
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
