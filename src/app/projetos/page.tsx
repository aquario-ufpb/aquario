"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { FilterBar } from "@/components/shared/filter-bar";
import ProjectCard from "@/components/shared/project-card";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { useProjetosInfinite } from "@/lib/client/hooks/use-projetos";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/client/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoginPromptDialog } from "@/components/shared/login-prompt-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";

// Map page-level filter ids to TipoEntidade enum values that the server expects.
// `null` → no filter; "PESSOAL" → only user-author projects; rest match Prisma's
// TipoEntidade enum (LABORATORIO, GRUPO, LIGA_ACADEMICA).
const FILTER_TO_TIPO: Record<string, string | undefined> = {
  pessoais: "PESSOAL",
  laboratorios: "LABORATORIO",
  grupos: "GRUPO",
  ligas: "LIGA_ACADEMICA",
};

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Projetos() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const debouncedSearch = useDebounced(searchQuery);
  const tipoEntidade = activeFilter ? FILTER_TO_TIPO[activeFilter] : undefined;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProjetosInfinite({
      search: debouncedSearch,
      tipoEntidade,
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

  const handleNovoProjetoClick = () => {
    if (user) {
      router.push("/projetos/novo");
    } else {
      setLoginPromptOpen(true);
    }
  };

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

        {/* Search and Filters */}
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
        </div>
      </div>

      {isLoading && projetos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[20rem] w-full rounded-xl" />
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
              <div className="col-span-full text-center text-muted-foreground py-12">
                Nenhum projeto encontrado com os filtros selecionados.
              </div>
            )}
          </div>

          {/* Loading skeletons for the next page */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-[20rem] w-full rounded-xl" />
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
