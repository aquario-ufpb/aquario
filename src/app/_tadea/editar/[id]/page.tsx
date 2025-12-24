"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!(
    user &&
    (user.permissoes.includes("ADMIN") || user.papelPlataforma === "MASTER_ADMIN")
  );

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.push("/tadea");
    }
  }, [isAuthLoading, isAdmin, router]);

  useEffect(() => {
    if (id && isAdmin) {
      const fetchItem = async () => {
        try {
          const response = await fetch(`http://localhost:3001/achados-e-perdidos/${id}`);
          if (!response.ok) {
            throw new Error("Falha ao buscar dados do item");
          }
          const data = await response.json();
          setTitulo(data.titulo);
          setDescricao(data.descricao);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Ocorreu um erro desconhecido");
          }
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchItem();
    }
  }, [id, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/achados-e-perdidos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, descricao }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao atualizar o item");
      }

      router.push("/tadea");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingData) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!isAdmin) {
    return null; // ou uma página de acesso negado
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 pt-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-4xl font-bold">Editar Item</h1>
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-lg">
            Título
          </Label>
          <Input id="titulo" value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-lg">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            rows={5}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </main>
  );
}
