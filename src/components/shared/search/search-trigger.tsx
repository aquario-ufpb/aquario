"use client";

import { Search } from "lucide-react";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[2.1rem] min-h-[2.1rem] w-[2.1rem] min-w-[2.1rem] items-center justify-center rounded-full border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Pesquisar (Ctrl+K)"
    >
      <Search className="h-[1.2rem] min-h-[1.2rem] w-[1.2rem] min-w-[1.2rem]" />
    </button>
  );
}
