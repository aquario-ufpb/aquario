"use client";

import React from "react";
import Image from "next/image";
import { User, LogOut, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";

import LinkHover from "@/components/shared/link-hover";
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
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const isDark = (resolvedTheme || theme) === "dark";

  const getInitials = (name: string) => {
    const names = name.split(" ");
    const initials = names.map(n => n[0]).join("");
    return initials.toUpperCase().slice(0, 2);
  };

  return (
    <>
      <nav className="fixed top-4 z-50 w-full flex justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-2 items-center h-[60px] px-6 gap-4 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg w-full max-w-4xl">
          {/* Left side - Logo */}
          <div className="flex items-center justify-start select-none">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer select-none"
              tabIndex={-1}
              draggable={false}
            >
              <Image
                className="h-6 w-auto dark:hidden select-none pointer-events-none"
                src="/logo2.svg"
                width={60}
                height={50}
                alt="Aquario's logo"
                draggable={false}
                style={{ userSelect: "none" }}
              />
              <Image
                className="h-6 w-auto hidden dark:block select-none pointer-events-none"
                src="/logo3.svg"
                width={60}
                height={50}
                alt="Aquario's logo"
                draggable={false}
                style={{ userSelect: "none" }}
              />
            </Link>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center justify-end gap-2">
            <LinkHover href="/sobre">SOBRE</LinkHover>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <NavigationMenu className="[&>div>div]:!mt-6">
              <NavigationMenuList>
                <NavigationMenuItem className="!h-auto !p-0 !m-0 !flex !items-start">
                  <NavigationMenuTrigger className="!h-auto !rounded-none !bg-transparent !px-0 !py-0 !font-normal hover:!bg-transparent focus:!bg-transparent focus:!outline-none data-[state=open]:!bg-transparent data-[active]:!bg-transparent">
                    <LinkHover href="/ferramentas">FERRAMENTAS</LinkHover>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="flex gap-4 p-4 w-auto">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/calendario"
                            className="flex flex-col items-center gap-2 select-none rounded-md p-4 min-w-[180px] no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Image
                              src={isDark ? "/calendario/dark.png" : "/calendario/light.png"}
                              alt="Calendário"
                              width={120}
                              height={80}
                              className="object-contain rounded-lg"
                            />
                            <div className="text-sm font-medium leading-none text-center">
                              Calendário
                            </div>
                            <p className="text-xs leading-snug text-muted-foreground text-center">
                              Visualize de horários
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/guias"
                            className="flex flex-col items-center gap-2 select-none rounded-md p-4 min-w-[180px] no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Image
                              src={isDark ? "/guias/dark.png" : "/guias/light.png"}
                              alt="Guias"
                              width={120}
                              height={80}
                              className="object-contain rounded-lg"
                            />
                            <div className="text-sm font-medium leading-none text-center">
                              Guias
                            </div>
                            <p className="text-xs leading-snug text-muted-foreground text-center">
                              Documentação e tutoriais
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/mapas"
                            className="flex flex-col items-center gap-2 select-none rounded-md p-4 min-w-[180px] no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <Image
                              src={isDark ? "/mapas/dark.png" : "/mapas/light.png"}
                              alt="Mapas"
                              width={120}
                              height={80}
                              className="object-contain rounded-lg"
                            />
                            <div className="text-sm font-medium leading-none text-center">
                              Mapas
                            </div>
                            <p className="text-xs leading-snug text-muted-foreground text-center">
                              Localização de salas
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <LinkHover href="/entidades">ENTIDADES</LinkHover>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.urlFotoPerfil || ""} alt={user.nome} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.nome)}
                          </AvatarFallback>
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
                ) : (
                  <LinkHover href="/login">ENTRAR</LinkHover>
                )}
              </>
            )}
            {!isAuthenticated && (
              <>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <ModeToggle />
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
