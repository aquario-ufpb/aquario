"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";
import TypeBadge from "@/components/shared/badges"; // Assumindo que este componente existe

// Tipos
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
  criadoEm: string;
};

export default function BlogPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Publicacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const fetchPost = async () => {
        try {
          const response = await fetch(`http://localhost:3001/publicacoes/${params.id}`);
          if (!response.ok) {
            throw new Error("Falha ao buscar a publicação");
          }
          const data = await response.json();
          setPost(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [params.id]);

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const timePosted = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos atrás`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} horas atrás`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dias atrás`;
  };

  if (isLoading) {
    // Skeleton para o novo layout
    return (
      <div className="flex justify-center items-start min-h-screen bg-background pt-24">
        <div className="flex flex-col p-6 bg-card rounded-lg shadow-md max-w-3xl w-full">
          <div className="flex">
            <div className="flex flex-col items-center pr-4">
              <Skeleton className="h-6 w-6 mb-1" />
              <Skeleton className="h-6 w-8 my-1" />
              <Skeleton className="h-6 w-6 mt-1" />
            </div>
            <div className="pl-4 w-full">
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="container mx-auto p-4 pt-24 text-center">Post não encontrado.</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted/20 pt-24">
      <div className="flex flex-col p-6 bg-card rounded-lg shadow-md max-w-6xl relative w-full">
        <div className="flex">
          {/* Coluna de Votos */}
          {/* <div className="flex flex-col items-center pr-4 text-muted-foreground">
            <button className="hover:text-primary" onClick={handleUpvote}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            </button>
            <span className="text-lg font-semibold text-foreground">{votes}</span>
            <button className="hover:text-destructive" onClick={handleDownvote}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div> */}

          {/* Linha Vertical (Opcional) */}
          {/* <div className="absolute top-[10rem] bottom-[7.5rem] w-px ml-3 bg-border"></div> */}

          {/* Conteúdo Principal */}
          <div className="pl-4 w-full">
            <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.autor.urlFotoPerfil || ""} alt={post.autor.nome} />
                <AvatarFallback>{getInitials(post.autor.nome)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">{post.autor.nome}</span>
              <TypeBadge type={"pessoa"} size="small" /> {/* Mockado */}
              <span>• {timePosted(post.criadoEm)}</span>
            </div>

            <article className="prose dark:prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-4">{post.titulo}</h1>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.conteudo) }} />
            </article>
          </div>
        </div>

        {/* <div className="flex justify-between items-center text-sm text-muted-foreground border-t mt-6 pt-4">
          <button className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80">
            Responder
          </button>
        </div> */}
      </div>
    </div>
  );
}
