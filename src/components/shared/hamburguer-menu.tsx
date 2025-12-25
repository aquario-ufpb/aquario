"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useBackend } from "@/lib/shared/config/env";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Settings } from "lucide-react";

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
};

function HamburgerIcon({ isOpen, onClick }: HamburgerIconProps) {
  const lineClass = "block w-6 h-0.5 bg-neutral-800 dark:bg-neutral-50";

  return (
    <button
      className="flex flex-col space-y-2 focus:outline-none p-2"
      onClick={onClick}
      aria-label="Toggle menu"
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
        className={`text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors block py-2 ${className}`}
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
        <div className="flex items-center justify-between w-full text-sm font-medium text-neutral-800 dark:text-neutral-200 py-2">
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
        className="flex items-center justify-between w-full text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-2"
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
            <AvatarImage src={user.urlFotoPerfil || undefined} alt={user.nome} />
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
          className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-2"
        >
          <User className="h-4 w-4" />
          <span>Perfil</span>
        </Link>
      </li>

      {/* Admin Link */}
      {user.papelPlataforma === "MASTER_ADMIN" && (
        <li>
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-2"
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
          className="flex items-center gap-2 w-full text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors py-2"
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
  { href: "/calendario", label: "CALENDÁRIO" },
  { href: "/mapas", label: "MAPAS" },
  { href: "/guias", label: "GUIAS" },
  { href: "/entidades", label: "ENTIDADES" },
] as const;

// ============================================================================
// Main Component
// ============================================================================

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { isEnabled: backendEnabled } = useBackend();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(prev => !prev);
  const isDark = mounted && (resolvedTheme || theme) === "dark";

  return (
    <nav className="fixed w-full text-light-text flex justify-between flex-col h-[60px] bg-white dark:bg-black z-50 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        <NavLogo />

        <div className="relative">
          <HamburgerIcon isOpen={isOpen} onClick={toggleMenu} />

          {/* Dropdown Menu */}
          <div
            className={`absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-border/50 shadow-lg rounded-lg transition-all duration-300 ease-in-out min-w-[200px] ${
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

              {/* User Section (only when backend is enabled) */}
              {backendEnabled && <UserSection onClose={closeMenu} />}

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
