"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle({ mobile = false }: { mobile?: boolean }) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme || theme) === "dark";

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="p-0 m-0 h-[2.1rem] w-[2.1rem] min-w-[2.1rem] min-h-[2.1rem]"
        disabled
      >
        <span className="sr-only">Carregando tema</span>
      </Button>
    );
  }

  // If mobile, return button without icon, just text
  if (mobile) {
    if (isDark) {
      return (
        <div
          onClick={() => setTheme("light")}
          className="p-0 m-0 gap-1 h-[2.1rem] min-h-[2.1rem] flex flex-row justify-center items-center group transition duration-300 cursor-pointer"
        >
          <Moon className="text-white group-hover:text-blue-500 transition duration-300 h-[1.2rem] w-[1.2rem] min-w-[1.2rem] min-h-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="text-sm dark:text-dark-text group-hover:text-blue-500 transition duration-300">
            TEMA
          </span>
        </div>
      );
    } else {
      return (
        <div
          onClick={() => setTheme("dark")}
          className="p-0 m-0 gap-1 h-[2.1rem] min-h-[2.1rem] flex flex-row justify-center items-center group transition duration-300 cursor-pointer"
        >
          <Sun className="text-aquario-primary group-hover:text-blue-500 transition duration-300 h-[1.2rem] w-[1.2rem] min-w-[1.2rem] min-h-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <span className="text-sm dark:text-dark-text group-hover:text-blue-500 transition duration-300">
            TEMA
          </span>
        </div>
      );
    }
  }

  if (isDark) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("light")}
        className="p-0 m-0 h-[2.1rem] w-[2.1rem] min-w-[2.1rem] min-h-[2.1rem]"
      >
        <Moon className="text-white absolute h-[1.2rem] w-[1.2rem] min-w-[1.2rem] min-h-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Mudar o tema</span>
      </Button>
    );
  } else {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme("dark")}
        className="p-0 m-0 h-[2.1rem] w-[2.1rem] min-w-[2.1rem] min-h-[2.1rem]"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] min-w-[1.2rem] min-h-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <span className="sr-only">Mudar o tema</span>
      </Button>
    );
  }
}
