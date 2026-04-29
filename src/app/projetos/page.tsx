"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { FilterBar } from "@/components/shared/filter-bar";
import ProjectCard from "@/components/shared/project-card";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { useProjetos } from "@/lib/client/hooks/use-projetos";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/client/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoginPromptDialog } from "@/components/shared/login-prompt-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";

export default function Projetos() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: projetosResponse, isLoading, error } = useProjetos();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const handleNovoProjetoClick = () => {
    if (user) {
      router.push("/projetos/novo");
    } else {
      setLoginPromptOpen(true);
    }
  };

  const projetos = useMemo(
    () => (projetosResponse?.projetos ?? []).map(mapProjetoToCard),
    [projetosResponse]
  );

  const filteredProjetos = useMemo(() => {
    let filtered = projetos;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        projeto =>
          projeto.nome.toLowerCase().includes(query) ||
          projeto.descricao.toLowerCase().includes(query) ||
          projeto.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (activeFilter) {
      switch (activeFilter) {
        case "pessoais":
          filtered = filtered.filter(p => p.tipo === "PESSOAL");
          break;
        case "laboratorios":
          filtered = filtered.filter(p => p.tipo === "LABORATORIO");
          break;
        case "grupos":
          filtered = filtered.filter(p => p.tipo === "GRUPO");
          break;
        case "ligas":
          filtered = filtered.filter(p => p.tipo === "LIGA");
          break;
      }
    }

    return filtered;
  }, [projetos, searchQuery, activeFilter]);

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-[20rem] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-12">Erro ao carregar projetos.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {filteredProjetos.length > 0 ? (
            filteredProjetos.map(projeto => (
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
