"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// Tipos
export type StatusItem = "PERDIDO" | "DEVOLVIDO";

type Autor = {
  id: string;
  nome: string;
  urlFotoPerfil?: string | null;
};

type ItemAchadoEPerdido = {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusItem;
  autor: Autor;
  urlsFotos: string[];
  criadoEm: string;
};

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { user, token, isAuthenticated } = useAuth();
  const [item, setItem] = useState<ItemAchadoEPerdido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      const fetchItem = async () => {
        try {
          const response = await fetch(`http://localhost:3001/achados-e-perdidos/${params.id}`);
          if (!response.ok) {
            throw new Error("Falha ao buscar o item");
          }
          const data = await response.json();
          setItem(data);
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
      fetchItem();
    }
  }, [params.id]);

  const handleUpdateStatus = async () => {
    if (!item) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/achados-e-perdidos/${item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "DEVOLVIDO" }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar status");
      }

      setItem({ ...item, status: "DEVOLVIDO" }); // Atualiza o estado localmente
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    }
  };

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error) {
    return <div className="container mx-auto p-4 pt-24 text-center text-red-500">{error}</div>;
  }

  if (!item) {
    return <div className="container mx-auto p-4 pt-24 text-center">Item não encontrado.</div>;
  }

  const isOwner = isAuthenticated && user?.id === item.autor.id;

  return (
    <main className="container mx-auto max-w-4xl p-4 pt-24">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-4xl font-bold">{item.titulo}</h1>
          <Badge
            variant={item.status === "PERDIDO" ? "destructive" : "default"}
            className="text-lg"
          >
            {item.status}
          </Badge>
        </div>

        <div className="flex items-center space-x-4 text-muted-foreground">
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.autor.urlFotoPerfil || ""} />
            <AvatarFallback>{item.autor.nome[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p>
              Reportado por <span className="font-semibold text-foreground">{item.autor.nome}</span>
            </p>
            <p className="text-sm">em {new Date(item.criadoEm).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <p className="text-lg whitespace-pre-wrap">{item.descricao}</p>

        {item.urlsFotos && item.urlsFotos.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Fotos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {item.urlsFotos.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={url}
                    alt={`Foto do item ${index + 1}`}
                    layout="fill"
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {isOwner && item.status === "PERDIDO" && (
          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold">Ações</h2>
            <p className="text-muted-foreground mb-4">Você reportou este item. Já o encontrou?</p>
            <Button onClick={handleUpdateStatus}>Marcar como Devolvido</Button>
          </div>
        )}
      </div>
    </main>
  );
}
