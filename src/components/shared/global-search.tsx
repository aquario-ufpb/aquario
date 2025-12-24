"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Users, Map, File } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

type SearchResult = {
  id: string;
  type: "entidade" | "guia" | "secao" | "subsecao" | "mapa" | "page";
  title: string;
  description?: string;
  url: string;
  category?: string;
};

type SearchResponse = {
  results: SearchResult[];
};

function getIconForType(type: string) {
  switch (type) {
    case "entidade":
      return <Users className="mr-2 h-4 w-4" />;
    case "guia":
    case "secao":
    case "subsecao":
      return <FileText className="mr-2 h-4 w-4" />;
    case "mapa":
      return <Map className="mr-2 h-4 w-4" />;
    case "page":
      return <File className="mr-2 h-4 w-4" />;
    default:
      return <Search className="mr-2 h-4 w-4" />;
  }
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data: SearchResponse = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(url);
  };

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      const category = result.category || "Outros";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });
    return groups;
  }, [results]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full border border-input hover:border-ring bg-transparent"
        aria-label="Pesquisar"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Pesquisar...</span>
        <kbd className="hidden md:inline md:flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Pesquisa Global</DialogTitle>
        <DialogDescription className="sr-only">
          Pesquise por entidades, guias, mapas e páginas do site
        </DialogDescription>
        <CommandInput
          placeholder="Pesquisar entidades, guias, mapas, páginas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!query && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite para pesquisar em todo o site...
            </div>
          )}

          {query && !isLoading && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground">Pesquisando...</div>
          )}

          {!isLoading &&
            Object.entries(groupedResults).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map(result => (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result.url)}
                  >
                    {getIconForType(result.type)}
                    <div className="flex flex-col">
                      <span className="font-medium">{result.title}</span>
                      {result.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {result.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
