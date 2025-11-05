"use client";

import SearchFilters from "@/components/shared/search-filters";
import Banner from "@/components/shared/banner";
import ProjectCard, { Projeto, Autor } from "@/components/shared/project-card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projetos() {
  type ProjetoComCriador = Omit<Projeto, "autor"> & {
    criadorId: string;
    tipo: string;
    tags: string[];
    membros?: { id: string }[];
  };
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeButton, setActiveButton] = useState("Todos");
  const [tagTerm, setTagTerm] = useState("");
  const [collaborators, setCollaborators] = useState("");

  const clearFilters = () => {
    setTagTerm("");
    setCollaborators("");
  };

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const response = await fetch("http://localhost:3001/projetos");
        if (!response.ok) {
          throw new Error("Falha ao buscar projetos");
        }
        const projetosData: ProjetoComCriador[] = await response.json();

        const projetosComAutor = await Promise.all(
          projetosData.map(async projeto => {
            try {
              const [autorResponse, detalhesResponse] = await Promise.all([
                fetch(`http://localhost:3001/usuarios/${projeto.criadorId}`),
                fetch(`http://localhost:3001/projetos/${projeto.id}`),
              ]);

              let autorData: Autor = { id: "", nome: "Desconhecido", urlFotoPerfil: null };
              if (autorResponse.ok) {
                autorData = await autorResponse.json();
              } else {
                console.error(`Falha ao buscar autor para o projeto ${projeto.id}`);
              }

              let membros: { id: string }[] = [];
              if (detalhesResponse.ok) {
                const detalhesData = await detalhesResponse.json();
                membros = detalhesData.membros || [];
              } else {
                console.error(`Falha ao buscar detalhes para o projeto ${projeto.id}`);
              }

              return { ...projeto, autor: autorData, membros };
            } catch (error) {
              console.error(`Erro ao buscar dados do projeto ${projeto.id}:`, error);
              return {
                ...projeto,
                autor: { id: "", nome: "Desconhecido", urlFotoPerfil: null },
                membros: [],
              };
            }
          })
        );

        setProjetos(projetosComAutor);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjetos();
  }, []);
  return (
    <main className="px-[10%]">
      <div className="space-y-6 flex flex-col">
        <div className="pt-4">
          <Banner
            title="Explore os projetos do Centro de Informática"
            description="Nosso mural de projetos permite visualizar projetos de qualquer pessoa ou laboratório."
            buttonText="Divulgar um projeto"
            buttonHref="/projetos/novo"
            showButton={!!user}
          />
        </div>
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeButton={activeButton}
          setActiveButton={setActiveButton}
          tagTerm={tagTerm}
          setTagTerm={setTagTerm}
          collaborators={collaborators}
          setCollaborators={setCollaborators}
          clearFilters={clearFilters}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full" />
            ))
          : projetos
              .filter(projeto => {
                const searchTermLower = searchTerm.toLowerCase();
                const tagTermLower = tagTerm.toLowerCase();

                const matchesSearchTerm =
                  projeto.titulo.toLowerCase().includes(searchTermLower) ||
                  projeto.descricao.toLowerCase().includes(searchTermLower);

                const matchesProjectType =
                  activeButton === "Todos" ||
                  (activeButton === "Pessoais" && projeto.tipo === "PESSOAL") ||
                  (activeButton === "Laboratórios" && projeto.tipo === "LABORATORIO") ||
                  (activeButton === "Grupos e Ligas" &&
                    (projeto.tipo === "GRUPO" || projeto.tipo === "LIGA"));

                const matchesTags =
                  tagTermLower === "" ||
                  (projeto.tags &&
                    projeto.tags.some((tag: string) => tag.toLowerCase().includes(tagTermLower)));

                const matchesCollaborators = (() => {
                  if (collaborators === "") {
                    return true;
                  }
                  if (!projeto.membros) {
                    return false;
                  }

                  const numMembros = projeto.membros.length;
                  const filterValue = parseInt(collaborators.replace("+", ""));

                  if (collaborators.endsWith("+")) {
                    return numMembros >= filterValue;
                  }
                  return numMembros === filterValue;
                })();

                return (
                  matchesSearchTerm && matchesProjectType && matchesTags && matchesCollaborators
                );
              })
              .map(projeto => (
                <Link href={`/projetos/${projeto.id}`} key={projeto.id}>
                  <ProjectCard projeto={projeto} />
                </Link>
              ))}
      </div>
    </main>
  );
}
