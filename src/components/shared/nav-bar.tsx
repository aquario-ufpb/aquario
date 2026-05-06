"use client";

import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  Activity,
  GitBranch,
  GraduationCap,
  LogOut,
  MapPinned,
  Moon,
  Settings,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";

import { SearchTrigger } from "@/components/shared/search/search-trigger";
import { ModeToggle } from "@/components/shared/mode-toggle";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import type { User as UserType } from "@/lib/client/api/usuarios";

const navLinkClass =
  "relative rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-aquario-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-slate-200 dark:hover:text-white";

const RESOURCES_PATHS = [
  "/recursos",
  "/calendario",
  "/guias",
  "/mapas",
  "/grades-curriculares",
  "/calendario-academico",
];

const NAV_PILL_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.6,
};

function NavPill() {
  return (
    <motion.span
      layoutId="nav-active-pill"
      className="absolute inset-0 -z-0 rounded-full bg-slate-100 dark:bg-white/10"
      transition={NAV_PILL_TRANSITION}
      aria-hidden
    />
  );
}

// Helper function
function getInitials(name: string): string {
  const names = name.split(" ");
  const initials = names.map(n => n[0]).join("");
  return initials.toUpperCase().slice(0, 2);
}

// Logo Component
function NavLogo() {
  return (
    <div className="flex items-center justify-start">
      <Link
        href="/"
        aria-label="Ir para a página inicial"
        className="-ml-2 flex cursor-pointer items-center rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Image
          className="h-7 w-auto dark:hidden"
          src="/logo2.svg"
          width={60}
          height={50}
          alt="Aquario's logo"
        />
        <Image
          className="hidden h-7 w-auto dark:block"
          src="/logo3.svg"
          width={60}
          height={50}
          alt="Aquario's logo"
        />
      </Link>
    </div>
  );
}

// Resources Dropdown Content Component
type Resource = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  external?: boolean;
};

const DROPDOWN_HIGHLIGHT_TRANSITION = {
  type: "spring" as const,
  stiffness: 400,
  damping: 34,
  mass: 0.5,
};

function ResourceItemContent({ resource }: { resource: Resource }) {
  return (
    <>
      <div className="relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-aquario-primary dark:bg-white/10 dark:text-sky-200">
        <resource.icon className="h-4 w-4" />
      </div>
      <div className="relative z-10">
        <div className="text-sm font-medium leading-none text-slate-900 dark:text-white">
          {resource.title}
        </div>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{resource.description}</p>
      </div>
    </>
  );
}

function ResourcesDropdownContent() {
  const resources: Resource[] = [
    {
      href: "/calendario",
      title: "Minhas Disciplinas",
      description: "Organize disciplinas, turmas e horários.",
      icon: CalendarDays,
    },
    {
      href: "/guias",
      title: "Guias",
      description: "Orientações para atravessar o curso.",
      icon: BookOpen,
    },
    {
      href: "/mapas",
      title: "Mapas",
      description: "Encontre salas e laboratórios do CI.",
      icon: MapPinned,
    },
    {
      href: "/grades-curriculares",
      title: "Grades Curriculares",
      description: "Veja requisitos, períodos e equivalências.",
      icon: GitBranch,
    },
    {
      href: "/calendario-academico",
      title: "Calendário Acadêmico",
      description: "Acompanhe datas importantes da UFPB.",
      icon: GraduationCap,
    },
    {
      href: "https://sigaacaiu.com",
      title: "SIGAA Caiu?",
      description: "Veja se o SIGAA UFPB está no ar.",
      icon: Activity,
      external: true,
    },
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemBaseClass =
    "relative flex gap-3 rounded-xl p-3 no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="w-[520px] p-3">
      <div className="mb-2 px-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Recursos</p>
        <p className="text-xs text-muted-foreground">Atalhos úteis para o dia a dia no CI.</p>
      </div>
      <LayoutGroup id="resources-dropdown">
        <ul
          className="grid grid-cols-2 gap-1"
          onMouseLeave={() => setHoveredIndex(null)}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setHoveredIndex(null);
            }
          }}
        >
          {resources.map((resource, index) => {
            const isHovered = hoveredIndex === index;
            const handleEnter = () => setHoveredIndex(index);
            const handleFocus = () => setHoveredIndex(index);
            const highlight = isHovered ? (
              <motion.span
                layoutId="resources-dropdown-highlight"
                className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-white/10"
                transition={DROPDOWN_HIGHLIGHT_TRANSITION}
                aria-hidden
              />
            ) : null;

            return (
              <li key={resource.href}>
                <NavigationMenuLink asChild>
                  {resource.external ? (
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={itemBaseClass}
                      onMouseEnter={handleEnter}
                      onFocus={handleFocus}
                    >
                      {highlight}
                      <ResourceItemContent resource={resource} />
                    </a>
                  ) : (
                    <Link
                      href={resource.href}
                      className={itemBaseClass}
                      onMouseEnter={handleEnter}
                      onFocus={handleFocus}
                    >
                      {highlight}
                      <ResourceItemContent resource={resource} />
                    </Link>
                  )}
                </NavigationMenuLink>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
      <div className="mt-2 border-t pt-2 dark:border-white/10">
        <NavigationMenuLink asChild>
          <Link
            href="/recursos"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-aquario-primary transition-colors hover:bg-slate-100 dark:text-sky-200 dark:hover:bg-white/10"
          >
            Ver todos os recursos
          </Link>
        </NavigationMenuLink>
      </div>
    </div>
  );
}

// Resources Navigation Component
function ResourcesNavigation({ isActive }: { isActive: boolean }) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={`${navLinkClass} h-auto bg-transparent data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent`}
          >
            {isActive && <NavPill />}
            <span className="relative z-10">Recursos</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ResourcesDropdownContent />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// User Dropdown Menu Component
function UserDropdownMenu({ user, isDark }: { user: UserType; isDark: boolean }) {
  const { setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full border border-slate-200 bg-white p-0 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.urlFotoPerfil || getDefaultAvatarUrl(user.id, user.nome)}
              alt={user.nome}
            />
            <AvatarFallback className="text-xs">{getInitials(user.nome)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.nome}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        {user.papelPlataforma === "MASTER_ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Administração</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Tema Escuro</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 dark:text-red-400 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Navigation Links Component
function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isResourcesActive = RESOURCES_PATHS.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  );

  return (
    <LayoutGroup id="nav-links">
      <div className="flex items-center justify-end gap-1">
        <Link href="/sobre" className={navLinkClass}>
          {isActive("/sobre") && <NavPill />}
          <span className="relative z-10">Sobre</span>
        </Link>
        <ResourcesNavigation isActive={isResourcesActive} />
        <Link href="/entidades" className={navLinkClass}>
          {isActive("/entidades") && <NavPill />}
          <span className="relative z-10">Entidades</span>
        </Link>
        <Link href="/projetos" className={navLinkClass}>
          {isActive("/projetos") && <NavPill />}
          <span className="relative z-10">Projetos</span>
        </Link>
      </div>
    </LayoutGroup>
  );
}

// Auth Section Component
function AuthSection() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const isLoading = authLoading || userLoading;
  const { theme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === "dark";

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return <UserDropdownMenu user={user} isDark={isDark} />;
  }

  return (
    <Button
      asChild
      size="sm"
      className="rounded-full bg-aquario-primary px-4 text-white hover:bg-aquario-primary/90"
    >
      <Link href="/login">Entrar</Link>
    </Button>
  );
}

type NavBarProps = {
  staticPosition?: boolean;
};

// Main NavBar Component
export default function NavBar({ staticPosition = false }: NavBarProps) {
  return (
    <nav
      className={`inset-x-0 top-0 z-50 bg-slate-50/90 backdrop-blur-xl dark:bg-slate-950/85 ${
        staticPosition ? "relative" : "fixed"
      }`}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <NavLogo />
        <div className="flex items-center justify-end gap-3">
          <NavLinks />
          <AuthSection />
          <SearchTrigger
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  ctrlKey: true,
                  bubbles: true,
                })
              );
            }}
          />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
