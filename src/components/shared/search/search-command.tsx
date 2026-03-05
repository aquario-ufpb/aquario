"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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
  pagina: { label: "Paginas", icon: FileText },
  guia: { label: "Guias", icon: BookOpen },
  entidade: { label: "Entidades", icon: Building2 },
  vaga: { label: "Vagas", icon: Briefcase },
  disciplina: { label: "Disciplinas", icon: BookMarked },
  curso: { label: "Cursos", icon: GraduationCap },
  usuario: { label: "Usuarios", icon: User },
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

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const { data, isLoading } = useSearch(query);

  useEffect(() => {
    setHistory(loadHistory());
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

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

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

  const hasQuery = query.trim().length >= 3;
  const hasResults =
    data && Object.values(data.results).some((arr) => arr.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Pesquisar no Aquario..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {hasQuery && isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Buscando...
          </div>
        )}

        {hasQuery && !isLoading && !hasResults && (
          <CommandEmpty>
            Nenhum resultado para &quot;{query.trim()}&quot;
          </CommandEmpty>
        )}

        {hasQuery &&
          !isLoading &&
          data &&
          CATEGORY_ORDER.map((kind) => {
            const key = RESULTS_KEY_MAP[kind] as keyof typeof data.results;
            const items = data.results[key] as SearchResultItem[];

            if (!items || items.length === 0) return null;

            const config = CATEGORY_CONFIG[kind];
            const Icon = config.icon;

            return (
              <CommandGroup key={kind} heading={config.label}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.kind}-${item.id}`}
                    value={`${item.kind}-${item.id}-${getItemLabel(item)}`}
                    onSelect={() => handleSelect(item)}
                  >
                    <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {highlightMatch(getItemLabel(item), query)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}

        {!hasQuery && history.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recentes">
              {history.map((term) => (
                <CommandItem
                  key={`history-${term}`}
                  value={`history-${term}`}
                  onSelect={() => handleHistorySelect(term)}
                >
                  <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
