"use client";

import { Search } from "lucide-react";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-full h-[2.1rem] w-[2.1rem] min-w-[2.1rem] min-h-[2.1rem] border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
      role="button"
      aria-label="Pesquisar (Ctrl+K)"
    >
      <Search className="h-[1.2rem] w-[1.2rem] min-w-[1.2rem] min-h-[1.2rem]" />
    </div>
  );
}
