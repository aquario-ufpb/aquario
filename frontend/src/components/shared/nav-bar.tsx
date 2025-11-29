"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useTheme } from "next-themes";

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

export default function NavBar() {
  const [query, setQuery] = useState("");
  const { theme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === "dark";

  const handleSearch = (_e: React.KeyboardEvent<HTMLInputElement>) => {
    // if (e.key === "Enter" && query.trim() !== "") {
    //   router.push(`/pesquisar?q=${query}`);
    // }
  };

  return (
    <>
      <nav className="fixed top-4 z-50 w-full flex justify-center">
        <div className="grid grid-cols-2 lg:grid-cols-3 items-center h-[60px] px-6 gap-4 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg w-full max-w-4xl">
          {/* Left side - Search (hidden on mobile) */}
          <div className="hidden lg:flex items-center justify-start">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 dark:text-zinc-300 z-10 pointer-events-none" />
              <input
                type="search"
                placeholder="Pesquisar"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full h-10 rounded-full border border-white/30 dark:border-white/30 pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground dark:placeholder:text-zinc-300 dark:text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 dark:focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 bg-transparent dark:bg-transparent backdrop-blur-0"
                style={{ backgroundColor: "transparent" }}
              />
            </div>
          </div>

          {/* Logo - Left on mobile, Center on desktop */}
          <div className="flex items-center justify-start md:justify-center select-none">
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
            {/* <ProfileButton /> */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <ModeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
