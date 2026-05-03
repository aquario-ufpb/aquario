"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  BookOpen,
  Building2,
  Briefcase,
  FolderKanban,
  GraduationCap,
  BookMarked,
  User,
  Clock,
  X,
  ChevronRight,
  Search,
} from "lucide-react";
import { useSearch } from "@/lib/client/hooks/use-search";
import type { SearchResultItem, SearchResultKind } from "@/lib/shared/types/search.types";

const HISTORY_KEY = "aquario:searchHistory";
const MAX_HISTORY = 8;

const CATEGORY_CONFIG: Record<SearchResultKind, { label: string; icon: React.ElementType }> = {
  pagina: { label: "PAGINAS", icon: FileText },
  guia: { label: "GUIAS", icon: BookOpen },
  entidade: { label: "ENTIDADES", icon: Building2 },
  vaga: { label: "VAGAS", icon: Briefcase },
  projeto: { label: "PROJETOS", icon: FolderKanban },
  disciplina: { label: "DISCIPLINAS", icon: BookMarked },
  curso: { label: "CURSOS", icon: GraduationCap },
  usuario: { label: "USUARIOS", icon: User },
};

const RESULTS_KEY_MAP: Record<SearchResultKind, string> = {
  pagina: "paginas",
  guia: "guias",
  entidade: "entidades",
  vaga: "vagas",
  projeto: "projetos",
  disciplina: "disciplinas",
  curso: "cursos",
  usuario: "usuarios",
};

const CATEGORY_ORDER: SearchResultKind[] = [
  "pagina",
  "guia",
  "entidade",
  "vaga",
  "projeto",
  "disciplina",
  "curso",
  "usuario",
];

const categoryLabelClass =
  "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400";

const ALLOWED_NEXT_IMAGE_HOSTS = new Set(["api.dicebear.com", "contrib.rocks"]);

function isAllowedNextImageSrc(src: string): boolean {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(src);
    return (
      protocol === "https:" &&
      (ALLOWED_NEXT_IMAGE_HOSTS.has(hostname) ||
        hostname.endsWith(".public.blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

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
    case "projeto":
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
    case "projeto":
      return item.subtitulo;
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
      return item.slug ? `/entidade/${item.slug}` : "/entidades";
    case "vaga":
      return `/vagas/${item.id}`;
    case "projeto":
      return `/projetos/${item.slug}`;
    case "disciplina":
      return `/grades-curriculares`;
    case "curso":
      return `/grades-curriculares`;
    case "usuario":
      return item.slug ? `/usuarios/${item.slug}` : `/perfil`;
  }
}

function getEntityLogo(item: SearchResultItem): { src: string; alt: string } | null {
  if (item.kind !== "entidade" || !item.imagePath || !isAllowedNextImageSrc(item.imagePath)) {
    return null;
  }

  return {
    src: item.imagePath,
    alt: `Logo de ${item.nome}`,
  };
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 3) {
    return text;
  }

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) {
    return text;
  }

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
    const next = [query, ...existing.filter(item => item !== query)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage errors
  }
}

// Flatten all results into a single list for keyboard navigation
function flattenResults(
  data: { results: Record<string, SearchResultItem[]> } | undefined
): SearchResultItem[] {
  if (!data) {
    return [];
  }
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
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
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName);

      if (isCmdK || isSlash) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input when opened, reset when closed
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      // Small delay to ensure DOM is ready after animation
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }

    setQuery("");
    setSelectedIndex(-1);
    previouslyFocusedRef.current?.focus();
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex < 0 || !resultsRef.current) {
      return;
    }
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
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable?.length) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }

        return;
      }

      const totalItems = hasQuery ? flatItems.length : history.length;
      if (totalItems === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev <= 0 ? totalItems - 1 : prev - 1));
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

  if (!open) {
    return null;
  }

  const showResults = hasQuery || history.length > 0;

  // Mobile: fullscreen overlay
  if (isMobile) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisar no Aquario"
        className="fixed inset-0 z-[100] bg-background flex flex-col animate-in slide-in-from-top duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 p-1 rounded-full hover:bg-accent"
            aria-label="Fechar pesquisa"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Pesquisar no Aquario..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Pesquisar"
          />
          {query && (
            <button
              type="button"
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
        </div>

        {/* Results */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto">
          <SearchResults
            hasQuery={hasQuery}
            isLoading={isLoading}
            hasResults={hasResults}
            data={data}
            query={query}
            history={history}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onHistorySelect={handleHistorySelect}
          />
        </div>
      </div>
    );
  }

  // Desktop: dropdown aligned with navbar
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Pesquisar no Aquario"
      className="fixed inset-0 z-[100]"
      onKeyDown={handleKeyDown}
    >
      {/* Soft backdrop to focus attention without feeling modal-heavy. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/10 backdrop-blur-[2px] dark:bg-slate-950/35"
        onClick={() => setOpen(false)}
      />

      {/* Search card — aligned with navbar (max-w-4xl, centered, below nav) */}
      <div className="absolute inset-x-0 top-[72px] flex justify-center px-6 animate-in slide-in-from-top-2 duration-150">
        <div className="w-full max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-950 dark:shadow-black/30">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-aquario-primary dark:bg-white/10 dark:text-sky-200">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                placeholder="Pesquisar no Aquario..."
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                aria-label="Pesquisar"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="ml-1 shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                ESC
              </kbd>
            </div>

            {/* Results (same card, continuous) */}
            {showResults && (
              <div ref={resultsRef} className="max-h-[58vh] overflow-y-auto p-2">
                <SearchResults
                  hasQuery={hasQuery}
                  isLoading={isLoading}
                  hasResults={hasResults}
                  data={data}
                  query={query}
                  history={history}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                  onHistorySelect={handleHistorySelect}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Extracted results rendering to avoid duplication between mobile/desktop
function SearchResults({
  hasQuery,
  isLoading,
  hasResults,
  data,
  query,
  history,
  selectedIndex,
  onSelect,
  onHistorySelect,
}: {
  hasQuery: boolean;
  isLoading: boolean;
  hasResults: boolean;
  data: { results: Record<string, SearchResultItem[]> } | undefined;
  query: string;
  history: string[];
  selectedIndex: number;
  onSelect: (item: SearchResultItem) => void;
  onHistorySelect: (term: string) => void;
}) {
  // Loading
  if (hasQuery && isLoading) {
    return (
      <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Buscando...
      </div>
    );
  }

  // No results
  if (hasQuery && !isLoading && !hasResults) {
    return (
      <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhum resultado para &quot;{query.trim()}&quot;
      </div>
    );
  }

  // Results
  if (hasQuery && !isLoading && data) {
    let globalIndex = 0;
    return (
      <>
        {CATEGORY_ORDER.map(kind => {
          const key = RESULTS_KEY_MAP[kind] as keyof typeof data.results;
          const items = data.results[key] as SearchResultItem[];

          if (!items || items.length === 0) {
            return null;
          }

          const config = CATEGORY_CONFIG[kind];
          const Icon = config.icon;

          return (
            <div key={kind} className="py-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <span className={categoryLabelClass}>{config.label}</span>
              </div>
              {items.map(item => {
                const idx = globalIndex++;
                const isSelected = idx === selectedIndex;
                const snippet = getItemSnippet(item);
                const entityLogo = getEntityLogo(item);

                return (
                  <button
                    type="button"
                    key={`${item.kind}-${item.id}`}
                    data-search-item
                    onClick={() => onSelect(item)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-sky-100 text-slate-950 dark:bg-white/10 dark:text-white"
                        : "hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {entityLogo && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-white/5">
                        <Image
                          src={entityLogo.src}
                          alt={entityLogo.alt}
                          width={32}
                          height={32}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
                        {highlightMatch(getItemLabel(item), query)}
                      </div>
                      {snippet && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {snippet}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                );
              })}
            </div>
          );
        })}
      </>
    );
  }

  // History (no query)
  if (!hasQuery && history.length > 0) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className={categoryLabelClass}>RECENTES</span>
        </div>
        {history.map((term, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              type="button"
              key={`history-${term}`}
              data-search-item
              onClick={() => onHistorySelect(term)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                isSelected
                  ? "bg-sky-100 text-slate-950 dark:bg-white/10 dark:text-white"
                  : "hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-sm font-medium">{term}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
