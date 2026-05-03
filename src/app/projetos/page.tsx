"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { FilterBar } from "@/components/shared/filter-bar";
import ProjectCard from "@/components/shared/project-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import {
  useProjetosInfinite,
  useUserProjetoCounts,
  type ProjetoOrderBy,
  type ProjetoOrder,
} from "@/lib/client/hooks/use-projetos";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/client/hooks";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { LoginPromptDialog } from "@/components/shared/login-prompt-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { trackEvent } from "@/analytics/posthog-client";

const FILTER_TO_TIPO: Record<string, string | undefined> = {
  pessoais: "PESSOAL",
  laboratorios: "LABORATORIO",
  grupos: "GRUPO",
  ligas: "LIGA_ACADEMICA",
};

/**
 * Tab keys are richer than raw status, because we split PUBLICADO into
 * "global" and "scoped to me" — both hit /projetos with status=PUBLICADO
 * but the latter passes scopedToMe=true.
 */
type TabKey = "PUBLICADO" | "MEUS_PUBLICADOS" | "RASCUNHO" | "ARQUIVADO";

type SortKey = "recent" | "oldest" | "title-asc" | "title-desc" | "authors-desc" | "authors-asc";

const SORT_OPTIONS: {
  value: SortKey;
  label: string;
  orderBy: ProjetoOrderBy;
  order: ProjetoOrder;
}[] = [
  { value: "recent", label: "Mais recentes", orderBy: "dataInicio", order: "desc" },
  { value: "oldest", label: "Mais antigos", orderBy: "dataInicio", order: "asc" },
  { value: "title-asc", label: "Título (A–Z)", orderBy: "titulo", order: "asc" },
  { value: "title-desc", label: "Título (Z–A)", orderBy: "titulo", order: "desc" },
  { value: "authors-desc", label: "Mais autores", orderBy: "autoresCount", order: "desc" },
  { value: "authors-asc", label: "Menos autores", orderBy: "autoresCount", order: "asc" },
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Skeleton that matches the dribbble-style ProjectCard layout. */
function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-3 px-0.5 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="mt-2 px-0.5 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

export default function Projetos() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("PUBLICADO");
  const [sort, setSort] = useState<SortKey>("recent");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const debouncedSearch = useDebounced(searchQuery);
  const tipoEntidade = activeFilter ? FILTER_TO_TIPO[activeFilter] : undefined;

  // Per-status counts driving the status tab strip. For MASTER_ADMIN counts
  // for rascunho/arquivado are global; for everyone else they're scoped to
  // projects the user can author or admin. publicadoMeus is always scoped.
  const isMasterAdmin = user?.papelPlataforma === "MASTER_ADMIN";
  const counts = useUserProjetoCounts(user?.id, isMasterAdmin);

  // Tab visibility:
  // - Publicados: always visible.
  // - Meus Publicados: only when the user has any (publicadoMeus > 0).
  // - Rascunhos / Arquivados: only when there's at least one to show.
  const showMeusPublicados = !!user && counts.publicadoMeus > 0;
  const showRascunhos = !!user && counts.rascunho > 0;
  const showArquivados = !!user && counts.arquivado > 0;
  const showStatusTabs = showMeusPublicados || showRascunhos || showArquivados;

  // Resolve tab → API params.
  const status: "PUBLICADO" | "RASCUNHO" | "ARQUIVADO" =
    tab === "RASCUNHO" ? "RASCUNHO" : tab === "ARQUIVADO" ? "ARQUIVADO" : "PUBLICADO";
  const scopedToMe = tab === "MEUS_PUBLICADOS";

  const sortOption = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0];

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProjetosInfinite({
      search: debouncedSearch,
      tipoEntidade,
      status,
      orderBy: sortOption.orderBy,
      order: sortOption.order,
      scopedToMe,
      pageSize: 12,
    });

  const projetos = useMemo(
    () => data?.pages.flatMap(p => p.projetos.map(mapProjetoToCard)) ?? [],
    [data]
  );
  const total = data?.pages[0]?.pagination.total ?? 0;

  // Sentinel that triggers loading the next page when scrolled into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) {
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fires once on mount (initial tab) and on every tab change. Filter/sort/search
  // changes are intentionally not tracked here — they'd be too noisy.
  useEffect(() => {
    trackEvent("projetos_list_viewed", { tab });
  }, [tab]);

  const handleNovoProjetoClick = () => {
    trackEvent("projeto_create_clicked", { logged_in: !!user });
    if (user) {
      router.push("/projetos/novo");
    } else {
      setLoginPromptOpen(true);
    }
  };

  const hasActiveFilters =
    !!activeFilter || !!debouncedSearch || tab !== "PUBLICADO" || sort !== "recent";

  const emptyStateMessage = (() => {
    if (tab === "RASCUNHO") {
      return "Nenhum projeto em rascunho.";
    }
    if (tab === "ARQUIVADO") {
      return "Nenhum projeto arquivado.";
    }
    if (tab === "MEUS_PUBLICADOS") {
      return "Você ainda não tem projetos publicados.";
    }
    if (hasActiveFilters) {
      return "Nenhum projeto encontrado com os filtros atuais. Tente outros critérios.";
    }
    return "Nenhum projeto publicado ainda. Seja o primeiro!";
  })();

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl pb-32">
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <PageHeader
            title={PAGE_HEADER_TEXT.projetos.title}
            subtitle={PAGE_HEADER_TEXT.projetos.extendedSubtitle}
          />
          <div className="hidden md:flex flex-shrink-0">
            <Button
              className="rounded-full bg-aquario-primary text-white hover:bg-aquario-primary/90"
              onClick={handleNovoProjetoClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Search, type filters, and sort */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar projetos..."
          />

          <FilterBar
            filters={[
              { id: null, label: "Todos" },
              { id: "pessoais", label: "Pessoais" },
              { id: "laboratorios", label: "Laboratórios" },
              { id: "grupos", label: "Grupos" },
              { id: "ligas", label: "Ligas" },
            ]}
            active={activeFilter}
            onChange={setActiveFilter}
          />

          <div className="md:ml-auto">
            <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
              <SelectTrigger className="w-[180px] rounded-full">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status tabs — Publicados is always shown; the others appear only
            when there's content (and Meus Publicados only when the user has any). */}
        {showStatusTabs && (
          <div className="mt-6">
            <Tabs value={tab} onValueChange={v => setTab(v as TabKey)}>
              <TabsList>
                <TabsTrigger value="PUBLICADO">
                  Publicados
                  {counts.publicadoGlobal > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {counts.publicadoGlobal}
                    </span>
                  )}
                </TabsTrigger>
                {showMeusPublicados && (
                  <TabsTrigger value="MEUS_PUBLICADOS">
                    Meus Publicados
                    <span className="ml-2 text-xs text-muted-foreground">
                      {counts.publicadoMeus}
                    </span>
                  </TabsTrigger>
                )}
                {showRascunhos && (
                  <TabsTrigger value="RASCUNHO">
                    Rascunhos
                    <span className="ml-2 text-xs text-muted-foreground">{counts.rascunho}</span>
                  </TabsTrigger>
                )}
                {showArquivados && (
                  <TabsTrigger value="ARQUIVADO">
                    Arquivados
                    <span className="ml-2 text-xs text-muted-foreground">{counts.arquivado}</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {isLoading && projetos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-12">Erro ao carregar projetos.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {projetos.length > 0 ? (
              projetos.map(projeto => (
                <Link href={`/projetos/${projeto.id}`} key={projeto.id} className="h-full">
                  <ProjectCard projeto={projeto} />
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
                <FolderKanban className="h-10 w-10 opacity-40" />
                <p className="text-sm">{emptyStateMessage}</p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter(null);
                      setTab("PUBLICADO");
                      setSort("recent");
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Loading skeletons for the next page */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Sentinel for IntersectionObserver — triggers next-page load */}
          {hasNextPage && <div ref={sentinelRef} className="h-px" aria-hidden />}

          {projetos.length > 0 && (
            <p className="text-sm text-muted-foreground text-center mt-10">
              {hasNextPage
                ? `Mostrando ${projetos.length} de ${total} projetos…`
                : `${total} ${total === 1 ? "projeto" : "projetos"} no total.`}
            </p>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-8 z-50 md:hidden">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-aquario-primary text-white shadow-lg hover:bg-aquario-primary/90 hover:shadow-xl transition-all"
          onClick={handleNovoProjetoClick}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Novo Projeto</span>
        </Button>
      </div>

      <LoginPromptDialog
        open={loginPromptOpen}
        onOpenChange={setLoginPromptOpen}
        description="Você precisa estar logado para criar um novo projeto."
      />
    </div>
  );
}
