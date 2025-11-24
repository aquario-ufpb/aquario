"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Checkbox from "@/components/pages/vagas/checkbox-filter";
import VacancyCard, { TipoVaga, Vaga } from "@/components/pages/vagas/vacancy-card";
import { SearchBar1 } from "@/components/ui/searchbar1";
// import { trackEvent } from "@/analytics/posthog-client";
import { Button } from "@/components/ui/button";
import { Github, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

function VagasCard({ vaga }: { vaga: Vaga }) {
  /*const handleClick = () => {
      trackEvent("entidade_viewed", {
        entidade_name: entidade.name as string,
        entidade_type: entidade.tipo as TipoEntidade,
      });
    };*/

  return (
    <Link href={"/vagas/${vaga.id}"} /*onClick={handleClick}*/ className="block">
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

  /*useEffect(() => {
    const fetchVagas = async () => {
      try {
        const response = await fetch("/vagas.json");
        if (!response.ok) throw new Error("Falha ao buscar vagas");
        const data: Vaga[] = await response.json();
        setVagas(data);
      } catch (error) {
        console.error("Erro ao buscar vagas:", error);
      }
    };

    fetchVagas();
  }, []);*/

  // Filters
  const vagasFiltradas = vagas.filter(vaga => {
    const q = searchQuery.toLowerCase();
    const entidade = vaga.entidade.toLowerCase();
    const tipo = vaga.tipoVaga.toLowerCase();
    const areas = vaga.areas?.map(a => a.toLowerCase()) ?? [];
    const inscricaoAte = vaga.inscricaoAte ? new Date(vaga.inscricaoAte) : null;

    const now = new Date();
    if (inscricaoAte && inscricaoAte < now) {
      return false; // Exclude expired job postings
    }

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

  // Static fallback slots
  useEffect(() => {
    if (vagas.length === 0) {
      const vagasPadrao: Vaga[] = [
        {
          id: "1",
          titulo: "UX/UI Designer",
          descricao: "",
          tipoVaga: TipoVaga.VOLUNTARIO,
          criadoEm: new Date().toISOString(),
          entidade: "laboratorios",
          publicador: { nome: "TRIL", urlFotoPerfil: "/ian.jpeg" },
          areas: ["Design", "FrontEnd"],
        },
        {
          id: "2",
          titulo: "Software Engineer Internship",
          descricao: "",
          tipoVaga: TipoVaga.ESTAGIO,
          criadoEm: new Date().toISOString(),
          entidade: "externo",
          publicador: { nome: "Google", urlFotoPerfil: "/ian.jpeg" },
          areas: ["BackEnd", "Infraestrutura"],
        },
        {
          id: "3",
          titulo: "Trainee",
          descricao: "",
          tipoVaga: TipoVaga.TRAINEE,
          criadoEm: new Date().toISOString(),
          entidade: "ligas",
          publicador: { nome: "TAIL", urlFotoPerfil: "/ian.jpeg" },
          areas: ["Robótica", "Pesquisa"],
        },
        {
          id: "4",
          titulo: "Voluntário Extensionista",
          descricao: "",
          tipoVaga: TipoVaga.VOLUNTARIO,
          criadoEm: new Date().toISOString(),
          inscricaoAte: new Date("2025-12-31").toISOString(),
          entidade: "ufpb",
          publicador: { nome: "UFPB", urlFotoPerfil: "/ian.jpeg" },
          areas: ["Otimização e Algoritmos", "Pesquisa"],
        },
        {
          id: "5",
          titulo: "Vaga Expirada",
          descricao: "Esta é uma vaga de exemplo que já expirou.",
          tipoVaga: TipoVaga.ESTAGIO,
          criadoEm: new Date("2024-01-01").toISOString(),
          inscricaoAte: new Date("2024-01-31").toISOString(),
          entidade: "externo",
          publicador: { nome: "Empresa Antiga", urlFotoPerfil: "/ian.jpeg" },
          areas: ["BackEnd"],
        },
      ];
      setVagas(vagasPadrao);
    }
  }, [vagas]);

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

          {/* Right column – Search + Jobs */}
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
