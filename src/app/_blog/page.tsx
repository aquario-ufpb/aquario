"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostCardTitle from "@/components/shared/project-card-title";
import SearchFilters from "@/components/shared/search-filters";
import Banner from "@/components/shared/banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Entidade } from "@/components/shared/entidade-card";

type Autor = {
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
};

type Publicacao = {
  id: string;
  titulo: string;
  conteudo: string;
  autor: Autor;
  entidadeId?: string | null;
  centroId: string;
  criadoEm: string;
  atualizadoEm: string;
};

export default function Blog() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeButton, setActiveButton] = useState("Todos");
  const [tagTerm, setTagTerm] = useState("");
  const [collaborators, setCollaborators] = useState("");

  const clearFilters = () => {
    setSearchTerm("");
    setActiveButton("Todos");
    setTagTerm("");
    setCollaborators("");
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [publicacoesRes, entidadesRes] = await Promise.all([
          fetch("http://localhost:3001/publicacoes"),
          fetch("http://localhost:3001/entidades"),
        ]);

        if (!publicacoesRes.ok || !entidadesRes.ok) {
          throw new Error("Falha ao buscar dados");
        }

        const publicacoesData = await publicacoesRes.json();
        const entidadesData = await entidadesRes.json();

        setPublicacoes(publicacoesData);
        setEntidades(entidadesData);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error("Ocorreu um erro desconhecido");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPublicacoes = publicacoes
    .filter(post => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        post.titulo.toLowerCase().includes(searchTermLower) ||
        post.conteudo.toLowerCase().includes(searchTermLower)
      );
    })
    .filter((post: Publicacao) => {
      if (activeButton === "Todos") {
        return true;
      }
      if (activeButton === "Pessoais") {
        return !post.entidadeId;
      }
      if (activeButton === "Laboratórios") {
        const entidade = entidades.find(e => e.id === post.entidadeId);
        return entidade && entidade.tipo === "LABORATORIO";
      }
      if (activeButton === "Grupos e Ligas") {
        const entidade = entidades.find(e => e.id === post.entidadeId);
        return (
          entidade && (entidade.tipo === "GRUPO_PESQUISA" || entidade.tipo === "LIGA_ACADEMICA")
        );
      }
      return true;
    });

  const calculateMinutesAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-4xl space-y-6">
        <div className="pt-12">
          <Banner
            title="Explore o que as pessoas, laboratórios e grupos do CI estão falando"
            description="Nosso blog é feito para que todos possam comunicar notícias, dúvidas e tutoriais para todos os alunos e colaboradores do Centro de Informática"
            buttonText="Fazer uma postagem"
            buttonHref="/blog/novo"
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
        <div className="space-y-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))
            : filteredPublicacoes
                .filter(post => post.autor)
                .map(post => (
                  <Link
                    href={`/blog/${post.id}`}
                    key={post.id}
                    className="block hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <div className="p-4">
                      <PostCardTitle
                        postTitle={post.titulo}
                        numVotes={0} // TODO: Mockado
                        numMinutes={calculateMinutesAgo(post.criadoEm)}
                        numComments={0} // TODO: Mockado
                        postUser={{
                          name: post.autor.nome,
                          image: post.autor.urlFotoPerfil ?? "",
                          type: "pessoa", // TODO: Mockado
                        }}
                      />
                    </div>
                  </Link>
                ))}
        </div>
      </div>
    </main>
  );
}
