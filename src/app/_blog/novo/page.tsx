"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/shared/editor/editor"), {
  ssr: false,
  loading: () => <div className="h-40 w-full bg-gray-100 animate-pulse rounded"></div>,
});
import { Skeleton } from "@/components/ui/skeleton";

export default function NovaPublicacaoPage() {
  const { token, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!titulo.trim() || !conteudo.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }

    if (!user) {
      setError("Usuário não encontrado. Por favor, faça login novamente.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/publicacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, conteudo, centroId: user.centro.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao criar publicação");
      }

      router.push("/blog");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <main className="container mx-auto max-w-6xl p-4 pt-24">
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl p-4 pt-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-4xl font-bold">Criar nova publicação</h1>
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-lg">
            Título
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Um título impactante para sua publicação"
            className="text-lg p-4"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-lg">Conteúdo</Label>
          <Editor onContentChange={setConteudo} />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" size="lg">
          Publicar
        </Button>
      </form>
    </main>
  );
}
