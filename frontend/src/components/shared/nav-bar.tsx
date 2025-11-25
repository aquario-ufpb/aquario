"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, LogOut, User as UserIcon } from "lucide-react";

import LinkHover from "@/components/shared/link-hover";
import { ModeToggle } from "@/components/shared/mode-toggle";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function NavBar() {
  const [query, setQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

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
            <LinkHover href="/calendario">CALENDÁRIO</LinkHover>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <LinkHover href="/guias">GUIAS</LinkHover>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <LinkHover href="/entidades">ENTIDADES</LinkHover>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <ModeToggle />
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            
            {/* Auth Section */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.urlFotoPerfil || undefined} alt={user.nome} />
                      <AvatarFallback>
                        {user.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.nome}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="h-8 px-3"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
