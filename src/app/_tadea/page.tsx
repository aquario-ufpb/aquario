"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import LostAndFoundCard from "@/components/pages/tadea/tadea";
import Banner from "@/components/shared/banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function TadeaPage() {
  const { data: user } = useCurrentUser();
  const [itens, setItens] = useState<ItemAchadoEPerdido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const { token } = useAuth();

  const isAdmin = !!(
    user &&
    (user.permissoes.includes("ADMIN") || user.papelPlataforma === "MASTER_ADMIN")
  );

  const handleStatusChange = async (id: string, status: StatusItem) => {
    try {
      const response = await fetch(`http://localhost:3001/achados-e-perdidos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar o status");
      }

      // Atualiza o estado local para refletir a mudança
      setItens(prevItens => prevItens.map(item => (item.id === id ? { ...item, status } : item)));
    } catch (error) {
      console.error(error);
      // TODO: Adicionar um toast de erro para o usuário
    }
  };

  useEffect(() => {
    const fetchItens = async () => {
      try {
        const response = await fetch("http://localhost:3001/achados-e-perdidos");
        if (!response.ok) {
          throw new Error("Falha ao buscar itens");
        }
        const data = await response.json();
        setItens(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItens();
  }, []);

  const calculateMinutesAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    return Math.floor(diffInMs / (1000 * 60));
  };

  return (
    <main className="container mx-auto p-4 -mt-24">
      <Banner
        title="Achados e Perdidos (TADEA)"
        description="Itens encontrados no Centro de Informática são guardados na sala da TADEA. Verifique aqui se seu item foi encontrado."
        buttonText="Reportar item perdido"
        buttonHref="/tadea/novo"
        showButton={isAdmin}
      />

      <div className="mt-8 flex gap-4">
        <Input
          placeholder="Buscar por título..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="PERDIDO">Perdido</SelectItem>
            <SelectItem value="DEVOLVIDO">Devolvido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <Skeleton className="h-40 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          : itens
              .filter(item => {
                const searchTermLower = searchTerm.toLowerCase();
                const titleLower = item.titulo.toLowerCase();
                const statusMatch = statusFilter === "TODOS" || item.status === statusFilter;
                const searchMatch = titleLower.includes(searchTermLower);
                return statusMatch && searchMatch;
              })
              .map(item => (
                <Link href={`/tadea/${item.id}`} key={item.id}>
                  <LostAndFoundCard
                    id={item.id}
                    title={item.titulo}
                    message={item.descricao}
                    timePostedInMinutes={calculateMinutesAgo(item.criadoEm)}
                    images={item.urlsFotos}
                    autor={item.autor}
                    status={item.status}
                    isAdmin={isAdmin}
                    onStatusChange={handleStatusChange}
                  />
                </Link>
              ))}
      </div>
    </main>
  );
}
