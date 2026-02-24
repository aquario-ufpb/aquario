"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Checkbox from "@/components/pages/vagas/checkbox-filter";
import VacancyCard from "@/components/pages/vagas/vacancy-card";
import type { Vaga } from "@/lib/shared/types";
import { SearchBar1 } from "@/components/ui/searchbar1";
import { Button } from "@/components/ui/button";
import { Plus, List, LayoutGrid } from "lucide-react";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { useVagas } from "@/lib/client/hooks";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { usePrefetchVaga } from "@/lib/client/hooks/use-prefetch";
import { cn } from "@/lib/client/utils";

type ViewMode = "list" | "grid";

const ENTIDADE_FILTER_MAP: Record<string, string[]> = {
  laboratorios: ["LABORATORIO"],
  grupos: ["GRUPO"],
  ligas: ["LIGA_ACADEMICA"],
  atletica: ["ATLETICA"],
  externo: ["EMPRESA"],
};

function VagasCard({
  vaga,
  variant,
  onPrefetch,
}: {
  vaga: Vaga;
  variant: ViewMode;
  onPrefetch: (id: string) => void;
}) {
  return (
    <Link
      href={`/vagas/${vaga.id}`}
      className={variant === "grid" ? "block h-full" : "block"}
      onMouseEnter={() => onPrefetch(vaga.id)}
    >
      <VacancyCard vaga={vaga} variant={variant} />
    </Link>
  );
}

export default function VagasPage() {
  const { data: vagas = [] } = useVagas();
  const { data: user } = useCurrentUser();
  const { data: memberships = [] } = useMyMemberships();
  const prefetchVaga = usePrefetchVaga();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const isMasterAdmin = user?.papelPlataforma === "MASTER_ADMIN";
  const isAdminOfSomeEntidade = memberships.some(m => m.papel === "ADMIN" && !m.endedAt);
  const canPostJob = !!(user && (isMasterAdmin || isAdminOfSomeEntidade));

  const vagasFiltradas = useMemo(() => {
    return vagas.filter(vaga => {
      const q = searchQuery.toLowerCase();
      const entidadeStr =
        typeof vaga.entidade === "string"
          ? vaga.entidade.toLowerCase()
          : vaga.entidade.nome.toLowerCase();
      const tipo = vaga.tipoVaga.toLowerCase();
      const areas = vaga.areas?.map(a => a.toLowerCase()) ?? [];

      const matchesSearch =
        !searchQuery.trim() ||
        vaga.titulo.toLowerCase().includes(q) ||
        vaga.publicador.nome.toLowerCase().includes(q) ||
        entidadeStr.includes(q);

      if (selectedCheckboxes.length === 0) return matchesSearch;

      const entidadeTipo =
        typeof vaga.entidade === "string" ? undefined : vaga.entidade.tipo?.toUpperCase();

      const matchesCheckbox = selectedCheckboxes.some(selected => {
        const entidadeTypes = ENTIDADE_FILTER_MAP[selected];
        if (entidadeTypes) {
          return entidadeTipo !== undefined && entidadeTypes.includes(entidadeTipo);
        }
        return selected === tipo || areas.includes(selected);
      });

      return matchesSearch && matchesCheckbox;
    });
  }, [vagas, searchQuery, selectedCheckboxes]);

  const handleCheckboxChange = (selected: string[]) => {
    setSelectedCheckboxes(selected.map(s => s.toLowerCase()));
  };

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold max-w-3xl">
            Explore vagas de emprego, estágio e projetos no CI e fora dele
          </h1>
          <div className="hidden md:flex flex-shrink-0">
            <ContributeOnGitHub
              url="https://github.com/aquario-ufpb/aquario-vagas"
              className="rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal"
            />
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 mt-10">
          {/* Left column – Checkbox */}
          <div className="hidden md:flex w-1/4">
            <Checkbox
              data={[
                {
                  titulo: "Entidades",
                  elementos: ["Laboratorios", "Grupos", "Ligas", "UFPB", "Externo"],
                },
                {
                  titulo: "Áreas",
                  elementos: [
                    "FrontEnd",
                    "BackEnd",
                    "Dados",
                    "Infraestrutura",
                    "Design",
                    "Pesquisa",
                    "Robótica",
                    "Otimização e Algoritmos",
                  ],
                },
                {
                  titulo: "Tipo",
                  elementos: ["Estagio", "Voluntario", "CLT", "PJ", "Pesquisa", "Trainee", "Outro"],
                },
              ]}
              onChange={handleCheckboxChange}
            />
          </div>

          {/* Right column – Search + Jobs */}
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Search row */}
            <div className="mb-6 flex items-center gap-2">
              <div className="flex-1">
                <SearchBar1
                  type="search"
                  placeholder="Pesquisar"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Divulgar vaga */}
              {canPostJob && (
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="hidden md:flex rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal flex-shrink-0"
                >
                  <Link href="/vagas/novo" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Divulgar vaga
                  </Link>
                </Button>
              )}

              {/* View mode toggle */}
              <div className="flex items-center border border-border rounded-full p-1 gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="Visualização em lista"
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Visualização em grade"
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {vagasFiltradas.length > 0 ? (
              viewMode === "list" ? (
                <div className="space-y-2">
                  {vagasFiltradas.map(vaga => (
                    <VagasCard key={vaga.id} vaga={vaga} variant="list" onPrefetch={prefetchVaga} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vagasFiltradas.map(vaga => (
                    <VagasCard key={vaga.id} vaga={vaga} variant="grid" onPrefetch={prefetchVaga} />
                  ))}
                </div>
              )
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Nenhuma vaga encontrada com os filtros selecionados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
