"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntidades } from "@/lib/client/hooks";
import { Entidade } from "@/lib/shared/types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { trackEvent } from "@/analytics/posthog-client";
import { TipoEntidade } from "@/lib/shared/types/entidade.types";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchBar } from "@/components/shared/search-bar";

function EntidadeCard({ entidade }: { entidade: Entidade }) {
  const getBadgeText = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "LAB";
      case "GRUPO_ESTUDANTIL":
        return "GRUPO";
      case "LIGA_ESTUDANTIL":
        return "LIGA";
      case "CENTRO_ACADEMICO":
        return "CA";
      case "ATLETICA":
        return "ATLETICA";
      case "EMPRESA":
        return "EMPRESA";
      default:
        return "OUTRO";
    }
  };

  const handleClick = () => {
    trackEvent("entidade_viewed", {
      entidade_name: entidade.name as string,
      entidade_type: entidade.tipo as TipoEntidade,
    });
  };

  return (
    <Link href={`/entidade/${entidade.slug}`} onClick={handleClick}>
      <Card className="hover:bg-accent/20 transition-all duration-200 cursor-pointer h-full border-border/90">
        <CardContent className="p-5">
          <div className="flex gap-4">
            {/* Image on the left */}
            <div className="flex-shrink-0 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entidade.imagePath || ""}
                alt={entidade.name}
                className="w-16 h-16 object-contain rounded-lg"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            {/* Content on the right */}
            <div className="flex-1 min-w-0">
              {/* Name with badge */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-semibold truncate flex-1">{entidade.name}</h3>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 flex-shrink-0 font-normal"
                >
                  {getBadgeText()}
                </Badge>
              </div>

              {/* Description */}
              {entidade.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {entidade.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EntidadesPage() {
  const { data: entidades = [], isLoading } = useEntidades();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Filter and sort entidades using useMemo
  const filteredEntidades = useMemo(() => {
    let filtered = entidades;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        entidade =>
          entidade.name.toLowerCase().includes(query) ||
          entidade.description?.toLowerCase().includes(query) ||
          entidade.subtitle?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (activeFilter) {
      switch (activeFilter) {
        case "laboratorios":
          filtered = filtered.filter(e => e.tipo === "LABORATORIO");
          break;
        case "grupos":
          filtered = filtered.filter(e => e.tipo === "GRUPO_ESTUDANTIL");
          break;
        case "ligas":
          filtered = filtered.filter(e => e.tipo === "LIGA_ESTUDANTIL");
          break;
        case "academicos":
          filtered = filtered.filter(e => e.tipo === "CENTRO_ACADEMICO" || e.tipo === "ATLETICA");
          break;
        case "empresas":
          filtered = filtered.filter(e => e.tipo === "EMPRESA");
          break;
      }
    }

    return filtered;
  }, [entidades, searchQuery, activeFilter]);

  // Group entidades by tipo per requested sections
  // Sort by order (lower numbers first), then alphabetically by name
  const sortEntidades = (a: Entidade, b: Entidade) => {
    // If both have order, sort by order
    if (a.order !== null && a.order !== undefined && b.order !== null && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only a has order, it comes first
    if (a.order !== null && a.order !== undefined) {
      return -1;
    }
    // If only b has order, it comes first
    if (b.order !== null && b.order !== undefined) {
      return 1;
    }
    // If neither has order, sort alphabetically
    return a.name.localeCompare(b.name);
  };

  const laboratorios = filteredEntidades.filter(e => e.tipo === "LABORATORIO").sort(sortEntidades);

  const gruposELigas = filteredEntidades
    .filter(
      e => e.tipo === "GRUPO_ESTUDANTIL" || e.tipo === "LIGA_ESTUDANTIL" || e.tipo === "OUTRO"
    )
    .sort(sortEntidades);

  const centrosEAtleticas = filteredEntidades
    .filter(e => e.tipo === "CENTRO_ACADEMICO" || e.tipo === "ATLETICA")
    .sort(sortEntidades);

  const empresasParceiras = filteredEntidades.filter(e => e.tipo === "EMPRESA").sort(sortEntidades);

  const showAllSections = !activeFilter && !searchQuery.trim();
  const showWhenSearching = searchQuery.trim() && !activeFilter; // Show all sections when searching without filter

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold max-w-3xl">
            Procure Laboratórios, ligas acadêmicas, grupos de pesquisa e outros
          </h1>
          <div className="hidden md:flex flex-shrink-0">
            <ContributeOnGitHub
              url="https://github.com/aquario-ufpb/aquario-entidades"
              className="rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal"
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar entidades..."
          />

          {/* Filter Buttons */}
          <FilterBar
            filters={[
              { id: null, label: "Todos" },
              { id: "laboratorios", label: "Laboratórios" },
              { id: "grupos", label: "Grupos" },
              { id: "ligas", label: "Ligas" },
              { id: "academicos", label: "Acadêmicos" },
              { id: "empresas", label: "Empresas" },
            ]}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Laboratórios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Laboratórios */}
          {(showAllSections || showWhenSearching || activeFilter === "laboratorios") &&
            laboratorios.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Laboratórios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {laboratorios.map(entidade => (
                    <EntidadeCard key={entidade.id} entidade={entidade} />
                  ))}
                </div>
              </div>
            )}

          {/* Grupos e Ligas (inclui Outros) */}
          {(showAllSections ||
            showWhenSearching ||
            activeFilter === "grupos" ||
            activeFilter === "ligas") &&
            gruposELigas.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Grupos e Ligas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gruposELigas.map(entidade => (
                    <EntidadeCard key={entidade.id} entidade={entidade} />
                  ))}
                </div>
              </div>
            )}

          {/* Centros Acadêmicos e Atléticas */}
          {(showAllSections || showWhenSearching || activeFilter === "academicos") &&
            centrosEAtleticas.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">
                  Centros Acadêmicos e Atléticas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {centrosEAtleticas.map(entidade => (
                    <EntidadeCard key={entidade.id} entidade={entidade} />
                  ))}
                </div>
              </div>
            )}

          {/* Empresas Parceiras */}
          {(showAllSections || showWhenSearching || activeFilter === "empresas") &&
            empresasParceiras.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Empresas Parceiras</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empresasParceiras.map(entidade => (
                    <EntidadeCard key={entidade.id} entidade={entidade} />
                  ))}
                </div>
              </div>
            )}

          {laboratorios.length === 0 &&
            gruposELigas.length === 0 &&
            centrosEAtleticas.length === 0 &&
            empresasParceiras.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Nenhuma entidade encontrada com os filtros selecionados.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
