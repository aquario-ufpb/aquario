"use client";

import React from "react";
import Image from "next/image";

import { SearchBar1 } from "@/components/ui/searchbar1";
import LinkHover from "@/components/shared/link-hover";

import { ModeToggle } from "@/components/shared/mode-toggle";
import Link from "next/link";

export default function NavBar() {
  return (
    <>
      <nav className="w-full text-light-text flex justify-between flex-col h-[60px] bg-white dark:bg-black z-50">
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex space-x-4 gap-5 justify-center items-center">
            <Link href="/">
              <Image
                className="w-16"
                src="/Image Card.png"
                width={75}
                height={75}
                alt="Aquario's logo"
              />
            </Link>
          </div>

          <div className="flex space-x-4 gap-5 justify-center items-center">
            <SearchBar1 type="search" placeholder="Pesquisar" />
            <LinkHover href="/sobre">SOBRE</LinkHover>
            <LinkHover href="/guias">GUIAS</LinkHover>
            <LinkHover href="/entidades">ENTIDADES</LinkHover>
            {/* <ProfileButton /> */}
            <ModeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
