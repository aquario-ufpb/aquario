"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  Building2,
  Briefcase,
  GraduationCap,
  BookMarked,
  User,
  Clock,
  X,
  ChevronRight,
  Search,
} from "lucide-react";
import { useSearch } from "@/lib/client/hooks/use-search";
import type {
  SearchResultItem,
  SearchResultKind,
} from "@/lib/shared/types/search.types";

const HISTORY_KEY = "aquario:searchHistory";
const MAX_HISTORY = 8;

const CATEGORY_CONFIG: Record<
  SearchResultKind,
  { label: string; icon: React.ElementType }
> = {
  pagina: { label: "PAGINAS", icon: FileText },
  guia: { label: "GUIAS", icon: BookOpen },
  entidade: { label: "ENTIDADES", icon: Building2 },
  vaga: { label: "VAGAS", icon: Briefcase },
  disciplina: { label: "DISCIPLINAS", icon: BookMarked },
  curso: { label: "CURSOS", icon: GraduationCap },
  usuario: { label: "USUARIOS", icon: User },
};

const RESULTS_KEY_MAP: Record<SearchResultKind, string> = {
  pagina: "paginas",
  guia: "guias",
  entidade: "entidades",
  vaga: "vagas",
  disciplina: "disciplinas",
  curso: "cursos",
  usuario: "usuarios",
};

const CATEGORY_ORDER: SearchResultKind[] = [
  "pagina",
  "guia",
  "entidade",
  "vaga",
  "disciplina",
  "curso",
  "usuario",
];

function getItemLabel(item: SearchResultItem): string {
  switch (item.kind) {
    case "pagina":
      return item.titulo;
    case "guia":
      return item.titulo;
    case "entidade":
      return item.nome;
    case "vaga":
      return item.titulo;
    case "disciplina":
      return `${item.codigo} - ${item.nome}`;
    case "curso":
      return item.nome;
    case "usuario":
      return item.nome;
  }
}

function getItemSnippet(item: SearchResultItem): string | null {
  switch (item.kind) {
    case "pagina":
      return item.descricao;
    case "guia":
      return item.descricao;
    case "entidade":
      return item.tipo.replace(/_/g, " ").toLowerCase();
    case "vaga":
      return item.tipoVaga.replace(/_/g, " ").toLowerCase();
    case "disciplina":
      return null;
    case "curso":
      return null;
    case "usuario":
      return null;
  }
}

function getItemRoute(item: SearchResultItem): string {
  switch (item.kind) {
    case "pagina":
      return item.url;
    case "guia":
      return `/guias/${item.slug}`;
    case "entidade":
      return `/entidade/${item.slug}`;
    case "vaga":
      return `/vagas/${item.id}`;
    case "disciplina":
      return `/grades-curriculares`;
    case "curso":
      return `/grades-curriculares`;
    case "usuario":
      return item.slug ? `/perfil/${item.slug}` : `/perfil`;
  }
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 3) return text;

  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="font-bold text-foreground">{match}</span>
      {after}
    </>
  );
}

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(query: string): void {
  try {
    const existing = loadHistory();
    const next = [query, ...existing.filter((item) => item !== query)].slice(
      0,
      MAX_HISTORY
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage errors
  }
}

// Flatten all results into a single list for keyboard navigation
function flattenResults(
  data: { results: Record<string, SearchResultItem[]> } | undefined
): SearchResultItem[] {
  if (!data) return [];
  const items: SearchResultItem[] = [];
  for (const kind of CATEGORY_ORDER) {
    const key = RESULTS_KEY_MAP[kind];
    const categoryItems = data.results[key] as SearchResultItem[] | undefined;
    if (categoryItems) {
      items.push(...categoryItems);
    }
  }
  return items;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useSearch(query);

  const flatItems = flattenResults(data);
  const hasQuery = query.trim().length >= 3;
  const hasResults = flatItems.length > 0;

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash =
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        );

      if (isCmdK || isSlash) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened, reset when closed
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready after animation
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      setSelectedIndex(-1);
      document.body.style.overflow = "";
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [data]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex < 0 || !resultsRef.current) return;
    const items = resultsRef.current.querySelectorAll("[data-search-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      const route = getItemRoute(item);
      const label = getItemLabel(item);
      saveHistory(label);
      setHistory(loadHistory());
      setOpen(false);
      router.push(route);
    },
    [router]
  );

  const handleHistorySelect = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      const totalItems = hasQuery ? flatItems.length : history.length;
      if (totalItems === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        if (hasQuery && flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        } else if (!hasQuery && history[selectedIndex]) {
          handleHistorySelect(history[selectedIndex]);
        }
      }
    },
    [hasQuery, flatItems, history, selectedIndex, handleSelect, handleHistorySelect]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onKeyDown={handleKeyDown}>
      {/* Backdrop (desktop only) */}
      {!isMobile && (
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Search container */}
      <div
        className={
          isMobile
            ? "absolute inset-0 bg-background flex flex-col animate-in slide-in-from-top duration-200"
            : "absolute inset-x-0 top-0 flex flex-col items-center pt-[10vh] animate-in slide-in-from-top-4 duration-200"
        }
      >
        {/* Search input */}
        <div
          className={
            isMobile
              ? "flex items-center gap-3 px-4 py-3 border-b border-border"
              : "w-full max-w-2xl px-4"
          }
        >
          <div
            className={`flex items-center gap-3 w-full rounded-xl border border-border bg-background shadow-lg ${
              isMobile ? "" : "px-4 py-3"
            }`}
          >
            {isMobile && (
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 p-1 rounded-full hover:bg-accent"
                aria-label="Fechar pesquisa"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            {!isMobile && <Search className="h-5 w-5 shrink-0 text-muted-foreground" />}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar no Aquario..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Pesquisar"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="shrink-0 p-1 rounded-full hover:bg-accent"
                aria-label="Limpar pesquisa"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {!isMobile && (
              <kbd className="shrink-0 ml-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Results dropdown */}
        <div
          ref={resultsRef}
          className={
            isMobile
              ? "flex-1 overflow-y-auto"
              : "w-full max-w-2xl px-4 mt-2"
          }
        >
          <div
            className={
              isMobile
                ? ""
                : "rounded-xl border border-border bg-background shadow-lg max-h-[60vh] overflow-y-auto"
            }
          >
            {/* Loading */}
            {hasQuery && isLoading && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}

            {/* No results */}
            {hasQuery && !isLoading && !hasResults && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para &quot;{query.trim()}&quot;
              </div>
            )}

            {/* Results grouped by category */}
            {hasQuery &&
              !isLoading &&
              data &&
              (() => {
                let globalIndex = 0;
                return CATEGORY_ORDER.map((kind) => {
                  const key = RESULTS_KEY_MAP[kind] as keyof typeof data.results;
                  const items = data.results[key] as SearchResultItem[];

                  if (!items || items.length === 0) return null;

                  const config = CATEGORY_CONFIG[kind];
                  const Icon = config.icon;

                  return (
                    <div key={kind} className="py-2">
                      <div className="flex items-center gap-2 px-4 py-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium tracking-wider text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                      {items.map((item) => {
                        const idx = globalIndex++;
                        const isSelected = idx === selectedIndex;
                        const snippet = getItemSnippet(item);

                        return (
                          <button
                            key={`${item.kind}-${item.id}`}
                            data-search-item
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-accent"
                                : "hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium leading-tight">
                                {highlightMatch(getItemLabel(item), query)}
                              </div>
                              {snippet && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                  {snippet}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  );
                });
              })()}

            {/* History (shown when no query) */}
            {!hasQuery && history.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground">
                    RECENTES
                  </span>
                </div>
                {history.map((term, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`history-${term}`}
                      data-search-item
                      onClick={() => handleHistorySelect(term)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-sm">{term}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
