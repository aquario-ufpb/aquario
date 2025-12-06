"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Tipos
type Curso = {
  nome: string;
};

type Centro = {
  nome: string;
  sigla: string;
};

type User = {
  id: string;
  nome: string;
  email: string;
  papel: "DISCENTE" | "DOCENTE";
  urlFotoPerfil?: string | null;
  periodo?: number | null;
  centro: Centro;
  curso?: Curso | null;
};

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`http://localhost:3001/usuarios/${params.id}`);
          if (!response.ok) {
            throw new Error("Usuário não encontrado");
          }
          const data = await response.json();
          setUser(data);
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
      fetchUser();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 pt-24 space-y-8">
        <div className="flex items-center space-x-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 pt-24 text-center text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4 pt-24 text-center">Usuário não encontrado.</div>;
  }

  return (
    <main className="container mx-auto max-w-4xl p-4 pt-24">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <Avatar className="w-36 h-36 border-4 border-background shadow-lg">
          <AvatarImage src={user.urlFotoPerfil || ""} alt={user.nome} />
          <AvatarFallback className="text-5xl">{user.nome.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold">{user.nome}</h1>
          <p className="text-lg text-muted-foreground">{user.curso?.nome || user.centro.nome}</p>
          {user.periodo && (
            <Badge variant="secondary" className="mt-2">
              {user.periodo}º Período
            </Badge>
          )}
        </div>
      </div>
    </main>
  );
}
