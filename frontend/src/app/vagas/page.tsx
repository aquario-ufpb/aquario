"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Checkbox from "@/components/pages/vagas/checkbox-filter";
import VacancyCard, { TipoVaga, Vaga } from "@/components/pages/vagas/vacancy-card";
import { SearchBar1 } from "@/components/ui/searchbar1";
// import { trackEvent } from "@/analytics/posthog-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";
import { useAuth } from "@/contexts/auth-context";
import { vagasService } from "@/lib/api/vagas";

function VagasCard({ vaga }: { vaga: Vaga }) {
  /*const handleClick = () => {
      trackEvent("entidade_viewed", {
        entidade_name: entidade.name as string,
        entidade_type: entidade.tipo as TipoEntidade,
      });
    };*/

  return (
    <Link href={`/vagas/${vaga.id}`} /*onClick={handleClick}*/ className="block">
      <VacancyCard vaga={vaga} />
    </Link>
  );
}

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
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
        const data = await vagasService.getAll();
        setVagas(data);
      } catch (error) {
        console.error("Error fetching vagas:", error);
      }
    };

    fetchVagas();
  }, []);

  // Filters
  const vagasFiltradas = vagas.filter(vaga => {
    const q = searchQuery.toLowerCase();
    const entidade = vaga.entidade.toLowerCase();
    const tipo = vaga.tipoVaga.toLowerCase();
    const areas = vaga.areas?.map(a => a.toLowerCase()) ?? [];

    // Text filters
    const matchesSearch =
      !searchQuery.trim() ||
      vaga.titulo.toLowerCase().includes(q) ||
      vaga.publicador.nome.toLowerCase().includes(q) ||
      entidade.includes(q);

    // Checkbox filters
    if (selectedCheckboxes.length === 0) {
      return matchesSearch;
    }

    const matchesCheckbox = selectedCheckboxes.some(selected => {
      return selected === entidade || selected === tipo || areas.includes(selected);
    });

    return matchesSearch && matchesCheckbox;
  });

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
                  elementos: ["Estagio", "Voluntario", "CLT", "PJ", "Pesquisa", "Trainee"],
                },
              ]}
              onChange={handleCheckboxChange}
            />
          </div>

          {/* Right column – Search + Jobs  */}
          <div className="w-full md:w-3/4 flex flex-col">
            <div className="mb-6 w-full">
              <SearchBar1
                type="search"
                placeholder="Pesquisar"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {vagasFiltradas.length > 0 ? (
                vagasFiltradas.map(vaga => <VagasCard key={vaga.id} vaga={vaga} />)
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma vaga encontrada com os filtros selecionados.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
