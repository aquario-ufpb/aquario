"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { FilterBar } from "@/components/shared/filter-bar";
import ProjectCard, { Projeto } from "@/components/shared/project-card";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/client/hooks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        setIsLoading(true);

        const response = await fetch("/api/projetos");
        if (!response.ok) {
          throw new Error("Erro ao buscar projetos");
        }

        const data = await response.json();

        const projetosMapeados: Projeto[] = data.projetos.map((p: any) => {
          let publicador;

          if (p.entidade) {
            publicador = {
              id: p.entidade.id,
              nome: p.entidade.nome,
              urlFotoPerfil: p.entidade.urlFoto ?? null,
              tipo: "ENTIDADE",
              entidadeTipo: p.entidade.tipo,
            };
          } else {
            const autorPrincipalObj = p.autores.find((a: any) => a.autorPrincipal);

            const autorPrincipal = autorPrincipalObj?.usuario;

            publicador = {
              id: autorPrincipal?.id ?? "0",
              nome: autorPrincipal?.nome ?? "Usuário",
              urlFotoPerfil: autorPrincipal?.urlFotoPerfil ?? null,
              tipo: "USUARIO",
            };
          }

          const colaboradores = p.autores.map((a: any) => ({
            id: a.usuario.id,
            nome: a.usuario.nome,
            urlFotoPerfil: a.usuario.urlFotoPerfil,
            autorPrincipal: a.autorPrincipal,
          }));

          return {
            id: p.slug,
            nome: p.titulo,
            descricao: p.descricao ?? "",
            imagem: p.urlImagem ?? null,
            tipo: p.entidade?.tipo ?? "PESSOAL",
            tags: p.tags ?? [],
            criadoEm: p.criadoEm,

            publicador,

            colaboradores,
            linkRepositorio: p.urlRepositorio ?? undefined,
            linkPrototipo: p.urlDemo ?? undefined,
          };
        });

        setProjetos(projetosMapeados);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjetos();
  }, []);

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
        case "entidades":
          filtered = filtered.filter(p => p.tipo === "GRUPO");
          break;
        case "ligas":
          filtered = filtered.filter(p => p.tipo === "LIGA");
          break;
        case "grupos":
          filtered = filtered.filter(p => p.tipo === "GRUPO");
          break;
      }
    }

    return filtered;
  }, [projetos, searchQuery, activeFilter]);

  return (
    <div className="container mx-auto p-4 md:p-8 mt-24 max-w-7xl">
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-display font-bold max-w-3xl">
              Explore os projetos do Centro de Informática
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Nosso mural de projetos permite visualizar projetos de qualquer laboratório, grupo,
              liga ou pessoa.
            </p>
          </div>
          {user && (
            <div className="hidden md:flex flex-shrink-0">
              <Button className="rounded-full" asChild>
                <Link href="/projetos/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Divulgar um projeto
                </Link>
              </Button>
            </div>
          )}
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
              { id: "entidades", label: "Grupos" },
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
    </div>
  );
}
