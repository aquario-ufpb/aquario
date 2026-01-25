"use client";

import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Pesquisar...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 w-full md:max-w-md rounded-full border border-gray-300 dark:border-gray-600">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 dark:text-zinc-300 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-8 rounded-full pl-10 pr-3 py-2 text-sm
            placeholder:text-muted-foreground dark:placeholder:text-zinc-300
            dark:text-zinc-300
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30
            bg-transparent dark:bg-transparent"
      />
    </div>
  );
}
