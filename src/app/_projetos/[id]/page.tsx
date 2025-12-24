"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Projeto } from "@/components/shared/project-card";

type Membro = {
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
};

type ProjetoDetalhado = {
  membros: Membro[];
  criador: {
    nome: string;
  };
  tags: string[];
} & Projeto;

export default function ProjetoPage({ params }: { params: { id: string } }) {
  const [projeto, setProjeto] = useState<ProjetoDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      const fetchProjeto = async () => {
        try {
          const response = await fetch(`http://localhost:3001/projetos/${params.id}`);
          if (!response.ok) {
            throw new Error("Projeto não encontrado");
          }
          const data = await response.json();
          setProjeto(data);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Ocorreu um erro desconhecido");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjeto();
    }
  }, [params.id]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error || !projeto) {
    return (
      <div className="container mx-auto p-4 -mt-24 text-center text-red-500">
        {error || "Projeto não encontrado."}
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl p-4 -mt-24">
      <Button className="mb-8" onClick={() => router.back()}>
        Voltar
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-96 w-full">
            <Image
              src={projeto.urlFoto || "/lab.jpg"}
              alt={projeto.titulo}
              layout="fill"
              objectFit="cover"
              className="rounded-xl border"
            />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">{projeto.titulo}</h1>
          <div className="flex flex-wrap gap-2">
            {projeto.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div
            className="prose dark:prose-invert max-w-none text-lg"
            dangerouslySetInnerHTML={{ __html: projeto.descricao }}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Criador</span>
                <span className="text-muted-foreground">{projeto.criador.nome}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Membros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.membros.map(membro => (
                <div key={membro.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={membro.urlFotoPerfil || ""} alt={membro.nome} />
                    <AvatarFallback>{membro.nome.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{membro.nome}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
