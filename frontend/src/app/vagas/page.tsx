"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Github } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Vaga } from "@/components/pages/vagas/vacancy-card";
import { Badge } from "@/components/ui/badge";
//import { trackEvent } from "@/analytics/posthog-client";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchBar } from "@/components/shared/search-bar";

function VagaCard({ vaga }: { vaga: Vaga }) {
  const getBadgeText = () => {
    switch (vaga.tipoVaga) {
      case "ESTAGIO":
        return "ESTÁGIO";
      case "PESQUISA":
        return "PESQUISA";
      case "VOLUNTARIO":
        return "VOLUNTÁRIO";
      case "TRAINEE":
        return "TRAINEE";
      case "CLT":
        return "CLT";
      default:
        return "OUTRO";
    }
  };

  /*const handleClick = () => {
    trackEvent("vaga_viewed", {
      vaga_titulo: vaga.titulo,
      vaga_tipo: vaga.tipoVaga,
      entidade_nome: vaga.publicador?.nome,
    });
  };*/

  return (
    <Link href={`/vagas/${vaga.id}`} /*onClick={handleClick}*/>
      <Card className="hover:bg-accent/20 transition-all duration-200 cursor-pointer h-full border-border/90">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center">
              <img
                src={vaga.publicador?.urlFotoPerfil || ""}
                alt={vaga.publicador?.nome || "Entidade"}
                className="w-16 h-16 object-contain rounded-lg"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-semibold truncate flex-1">{vaga.titulo}</h3>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 flex-shrink-0 font-normal"
                >
                  {getBadgeText()}
                </Badge>
              </div>

              {vaga.publicador?.nome && (
                <p className="text-sm font-medium text-foreground/80">{vaga.publicador.nome}</p>
              )}

              {vaga.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {vaga.descricao}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { user } = useAuth();

  const canPostJob = !!(
    user &&
    (user.papel === "DOCENTE" ||
      user.permissoes.includes("ADMIN") ||
      user.papelPlataforma === "MASTER_ADMIN")
  );

  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const response = await fetch("/vagas.json");
        if (!response.ok) {
          throw new Error("Falha ao buscar vagas");
        }
        const data = await response.json();
        setVagas(data);
      } catch (error) {
        console.error("Erro ao buscar vagas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVagas();
  }, []);

  // Filter function
  const filterVagas = (vagas: Vaga[]) => {
    let filtered = vagas;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        v =>
          v.titulo.toLowerCase().includes(query) ||
          v.descricao?.toLowerCase().includes(query) ||
          v.tipoVaga?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (activeFilter) {
      switch (activeFilter) {
        case "clt":
          filtered = filtered.filter(v => v.tipoVaga === "CLT");
          break;
        case "voluntario":
          filtered = filtered.filter(v => v.tipoVaga === "VOLUNTARIO");
          break;
        case "estagio":
          filtered = filtered.filter(v => v.tipoVaga === "ESTAGIO");
          break;
        case "pesquisa":
          filtered = filtered.filter(v => v.tipoVaga === "PESQUISA");
          break;
        case "trainee":
          filtered = filtered.filter(v => v.tipoVaga === "TRAINEE");
          break;
        case "pj":
          filtered = filtered.filter(v => v.tipoVaga === "PJ");
          break;
      }
    }

    return filtered;
  };

  // Group vagas by tipo per requested sections
  // Sort by order (lower numbers first), then alphabetically by name
  const filteredVagas = filterVagas(vagas);

  const sortVagas = (a: Vaga, b: Vaga) => {
    // Sort alphabetically
    return a.titulo.localeCompare(b.titulo);
  };

  const estagios = filteredVagas.filter(v => v.tipoVaga === "ESTAGIO").sort(sortVagas);
  const pesquisas = filteredVagas.filter(v => v.tipoVaga === "PESQUISA").sort(sortVagas);
  const voluntarios = filteredVagas.filter(v => v.tipoVaga === "VOLUNTARIO").sort(sortVagas);
  const trainees = filteredVagas.filter(v => v.tipoVaga === "TRAINEE").sort(sortVagas);
  const clts = filteredVagas.filter(v => v.tipoVaga === "CLT").sort(sortVagas);
  const pjs = filteredVagas.filter(v => v.tipoVaga === "PJ").sort(sortVagas);

  const showAllSections = !activeFilter && !searchQuery.trim();
  const showWhenSearching = searchQuery.trim() && !activeFilter; // Show all sections when searching without filter

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold max-w-3xl">
            Explore vagas de emprego, estágio e projetos no CI e fora dele
          </h1>
          <Button
            asChild
            variant="default"
            size="sm"
            className="hidden md:flex rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal flex-shrink-0"
          >
            <a
              href="https://github.com/aquario-ufpb/aquario-entidades"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              Contribuir no GitHub
            </a>
          </Button>
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
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Pesquisar vagas..."
          />

          {/* Filter Buttons */}
          <FilterBar
            filters={[
              { id: null, label: "Todos" },
              { id: "clt", label: "CLT" },
              { id: "voluntario", label: "Voluntário" },
              { id: "pesquisa", label: "Pesquisa" },
              { id: "estagio", label: "Estágio" },
              { id: "trainee", label: "Trainee" },
              { id: "pj", label: "PJ" },
            ]}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-10">
          <h2 className="text-2xl font-semibold">Carregando vagas...</h2>
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
      ) : (
        <div className="space-y-12">
          {/* Estágios */}
          {(showAllSections || showWhenSearching || activeFilter === "estagio") &&
            estagios.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Estágios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estagios.map(vaga => (
                    <VagaCard key={vaga.id} vaga={vaga} />
                  ))}
                </div>
              </div>
            )}

          {/* Voluntário */}
          {(showAllSections || showWhenSearching || activeFilter === "voluntario") &&
            voluntarios.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Voluntário</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voluntarios.map(vaga => (
                    <VagaCard key={vaga.id} vaga={vaga} />
                  ))}
                </div>
              </div>
            )}

          {/* Trainee */}
          {(showAllSections || showWhenSearching || activeFilter === "trainee") &&
            trainees.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Trainee</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainees.map(vaga => (
                    <VagaCard key={vaga.id} vaga={vaga} />
                  ))}
                </div>
              </div>
            )}

          {/* Pesquisa */}
          {(showAllSections || showWhenSearching || activeFilter === "pesquisa") &&
            pesquisas.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold">Pesquisa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pesquisas.map(vaga => (
                    <VagaCard key={vaga.id} vaga={vaga} />
                  ))}
                </div>
              </div>
            )}

          {/* CLT */}
          {(showAllSections || showWhenSearching || activeFilter === "clt") && clts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold">CLT</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clts.map(vaga => (
                  <VagaCard key={vaga.id} vaga={vaga} />
                ))}
              </div>
            </div>
          )}

          {/* PJ */}
          {(showAllSections || showWhenSearching || activeFilter === "pj") && pjs.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold">PJ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pjs.map(vaga => (
                  <VagaCard key={vaga.id} vaga={vaga} />
                ))}
              </div>
            </div>
          )}

          {filteredVagas.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Nenhuma vaga encontrada com os filtros selecionados.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
