import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Command, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";

export type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const SearchBar1 = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputInnerRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    const [history, setHistory] = useState<string[]>([]);

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const normalizedQuery = normalize(query);

    const quickNav = [
      { label: "Guias", href: "/guias", synonyms: ["guia", "guias", "ajuda", "como", "tutorial"] },
      { label: "Sobre", href: "/sobre", synonyms: ["sobre", "info", "informacao", "informacoes"] },
    ];

    const guiaMatches = () => {
      const items: Array<{ label: string; href: string }> = [];
      if (
        /\b(dados|ciencia\s*de\s*dados|ci[êe]ncias?\s*de\s*dados|ia|inteligencia\s*artificial|machine\s*learning)\b/.test(
          normalizedQuery
        )
      ) {
        items.push({
          label: "Guias: Ciências de Dados e IA",
          href: "/guias/ciencias-de-dados-e-inteligencia-artificial",
        });
      }
      if (/\b(ciencia\s*da\s*computacao|cc|programacao|algoritmos)\b/.test(normalizedQuery)) {
        items.push({ label: "Guias: Ciência da Computação", href: "/guias/ciencia-da-computacao" });
      }
      if (
        /\b(engenharia\s*da\s*computacao|ec|eletronica|hardware|embarcados)\b/.test(
          normalizedQuery
        )
      ) {
        items.push({
          label: "Guias: Engenharia da Computação",
          href: "/guias/engenharia-da-computacao",
        });
      }
      return items;
    };

    const navMatches = normalizedQuery
      ? quickNav.filter(t => {
          const normLabel = normalize(t.label);
          if (normLabel === normalizedQuery) {
            return true;
          }
          if (t.synonyms.some(s => normalize(s) === normalizedQuery)) {
            return true;
          }
          if (
            normalizedQuery.length >= 3 &&
            (normLabel.startsWith(normalizedQuery) ||
              t.synonyms.some(s => normalize(s).startsWith(normalizedQuery)))
          ) {
            return true;
          }
          return false;
        })
      : [];

    const guiaItems = guiaMatches();
    const hasAnySuggestions = guiaItems.length > 0 || navMatches.length > 0;

    const recordHistory = (q: string) => {
      try {
        const key = "aquario:searchHistory";
        const existing: string[] = JSON.parse(localStorage.getItem(key) || "[]");
        const next = [q, ...existing.filter(item => item !== q)].slice(0, 8);
        localStorage.setItem(key, JSON.stringify(next));
        setHistory(next);
      } catch {}
    };

    useEffect(() => {
      try {
        const key = "aquario:searchHistory";
        const existing: string[] = JSON.parse(localStorage.getItem(key) || "[]");
        setHistory(existing);
      } catch {}
    }, []);

    useEffect(() => {
      if (!query.trim()) {
        setOpen(false);
        return;
      }
      const id = setTimeout(() => {
        setOpen(true);
      }, 150);
      return () => clearTimeout(id);
    }, [query]);

    useEffect(() => {
      const onClick = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const value = query.trim();
      if (!value) {
        return;
      }
      const normalized = normalize(value);
      const exactNav = quickNav.find(t =>
        normalize(t.label) === normalized || t.synonyms.includes(normalized)
      );
      if (exactNav) {
        router.push(exactNav.href);
        setOpen(false);
        return;
      }
      recordHistory(value);
      setOpen(true);
    };

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
        if (isCmdK || e.key === "/") {
          e.preventDefault();
          inputInnerRef.current?.focus();
          setOpen(Boolean(query.trim()));
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [query]);
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 dark:text-zinc-300" />
          <input
            type="search"
            aria-label="Pesquisar"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            className={cn(
              "flex h-10 w-full rounded-full border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-zinc-300 dark:text-zinc-300 dark:placeholder:text-zinc-300",
              className
            )}
            ref={node => {
              inputInnerRef.current = node;
              if (!ref) {
                return;
              }
              if (typeof ref === "function") {
                ref(node);
              } else {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
            }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar"
            {...props}
          />
          {query && (
            <button
              type="button"
              aria-label="Limpar pesquisa"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputInnerRef.current?.focus();
              }}
            >
              <X className="w-5 dark:text-zinc-300" />
            </button>
          )}
        </form>

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <Command>
              <CommandList id="search-suggestions">
                {guiaItems.length > 0 && (
                  <CommandGroup heading="Guias recomendados">
                    {guiaItems.map(item => (
                      <CommandItem
                        key={item.href}
                        onSelect={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                      >
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {navMatches.length > 0 && (
                  <CommandGroup heading="Navegar">
                    {navMatches.map(item => (
                      <CommandItem
                        key={`nav-${item.href}`}
                        onSelect={() => {
                          router.push(item.href);
                          setOpen(false);
                        }}
                      >
                        Ir para {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {!hasAnySuggestions && query.trim() && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum resultado para &quot;{query}&quot;
                  </div>
                )}
                {history.length > 0 && (
                  <CommandGroup heading="Recentes">
                    {history.slice(0, 5).map(h => (
                      <CommandItem
                        key={`hist-${h}`}
                        onSelect={() => {
                          setQuery(h);
                          recordHistory(h);
                          setOpen(true);
                          inputInnerRef.current?.focus();
                        }}
                      >
                        {h}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    );
  }
);
SearchBar1.displayName = "SearchBar1";

export { SearchBar1 };