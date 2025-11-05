"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import Link from "next/link";
import * as React from "react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const isDark = mounted && (resolvedTheme || theme) === "dark";

  return (
    <>
      <nav className="fixed w-full text-light-text flex justify-between flex-col h-[60px] bg-white dark:bg-black z-50 border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-full px-4">
          <div className="flex space-x-4 gap-5 justify-center items-center">
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
          </div>

          <div className="relative">
            {/* Hamburger Icon */}
            <button
              className="flex flex-col space-y-2 focus:outline-none p-2"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span
                className={`block w-6 h-0.5 bg-neutral-800 dark:bg-neutral-50 transition-transform duration-300 ease-in-out ${
                  isOpen ? "rotate-45 translate-y-2.5" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-neutral-800 dark:bg-neutral-50 transition-opacity duration-300 ease-in-out ${
                  isOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-neutral-800 dark:bg-neutral-50 transition-transform duration-300 ease-in-out ${
                  isOpen ? "-rotate-45 -translate-y-2.5" : ""
                }`}
              ></span>
            </button>

            {/* Menu */}
            <div
              className={`absolute top-full right-0 mt-2 bg-white dark:bg-neutral-800 border border-border/50 shadow-lg rounded-lg transition-all duration-300 ease-in-out min-w-[200px] ${
                isOpen ? "opacity-100 visible z-50" : "opacity-0 invisible pointer-events-none"
              }`}
            >
              <ul className="flex flex-col p-4 space-y-3">
                <li>
                  <Link
                    href="/sobre"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors block py-2"
                  >
                    SOBRE
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guias"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors block py-2"
                  >
                    GUIAS
                  </Link>
                </li>
                <li>
                  <Link
                    href="/entidades"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors block py-2"
                  >
                    ENTIDADES
                  </Link>
                </li>
                <li className="pt-2 border-t border-border/50">
                  {/* Theme Toggle */}
                  {mounted ? (
                    <button
                      onClick={() => {
                        setTheme(isDark ? "light" : "dark");
                      }}
                      className="flex items-center justify-between w-full text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors py-2"
                    >
                      <span>Tema</span>
                      <div className="relative">
                        {/* Toggle Switch */}
                        <div
                          className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                            isDark ? "bg-blue-500" : "bg-neutral-300"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                              isDark ? "translate-x-6" : "translate-x-0"
                            }`}
                          ></div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full text-sm font-medium text-neutral-800 dark:text-neutral-200 py-2">
                      <span>Tema</span>
                      <div className="w-12 h-6 rounded-full bg-neutral-300 animate-pulse"></div>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
