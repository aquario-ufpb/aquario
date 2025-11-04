"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { entidadesService } from "@/lib/api/entidades";
import { Entidade, TipoEntidade } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function EntidadeCard({ entidade }: { entidade: Entidade }) {
  const getBadgeVariant = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "default";
      case "GRUPO_PESQUISA":
        return "secondary";
      case "LIGA_ACADEMICA":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <Link href={`/entidade/${entidade.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="flex flex-col items-center text-center p-6">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage
              src={entidade.imagePath || ""}
              alt={entidade.name}
              className="object-cover"
            />
            <AvatarFallback>{entidade.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg font-semibold truncate w-full">{entidade.name}</CardTitle>
          <Badge variant={getBadgeVariant()} className="mt-2">
            {entidade.tipo.replace("_", " ")}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EntidadesPage() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Todos" | TipoEntidade>("Todos");
  const [filteredEntidades, setFilteredEntidades] = useState<Entidade[]>([]);

  useEffect(() => {
    const fetchEntidades = async () => {
      try {
        const data = await entidadesService.getAll();
        setEntidades(data);
        setFilteredEntidades(data);
      } catch (error) {
        console.error("Error fetching entidades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntidades();
  }, []);

  useEffect(() => {
    if (activeTab === "Todos") {
      setFilteredEntidades(entidades);
    } else {
      setFilteredEntidades(entidades.filter(e => e.tipo === activeTab));
    }
  }, [activeTab, entidades]);

  const tabs = ["Todos", "LABORATORIO", "GRUPO_PESQUISA", "LIGA_ACADEMICA", "OUTRO"] as const;

  return (
    <div className="container mx-auto p-4 pt-24">
      <h1 className="text-3xl font-bold mb-8">Entidades</h1>

      <div className="flex gap-4 mb-8 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "Todos" | TipoEntidade)}
            className={`px-4 py-2 rounded-full transition-all duration-200 ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {tab === "Todos" ? "Todos" : tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-2 flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredEntidades.length > 0 ? (
            filteredEntidades.map(entidade => (
              <EntidadeCard key={entidade.id} entidade={entidade} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              Nenhuma entidade encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
