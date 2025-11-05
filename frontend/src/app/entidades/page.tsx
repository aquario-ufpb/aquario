"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { entidadesService } from "@/lib/api/entidades";
import { Entidade } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/analytics/posthog-client";
import { TipoEntidade } from "@/lib/types/entidade.types";

function EntidadeCard({ entidade }: { entidade: Entidade }) {
  const getBadgeText = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "LAB";
      case "GRUPO_ESTUDANTIL":
        return "GRUPO";
      case "LIGA_ESTUDANTIL":
        return "LIGA";
      case "CENTRO_ACADEMICO":
        return "CA";
      case "ATLETICA":
        return "ATLETICA";
      case "EMPRESA":
        return "EMPRESA";
      default:
        return "OUTRO";
    }
  };

  const getBadgeVariant = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "default";
      case "GRUPO_ESTUDANTIL":
        return "secondary";
      case "LIGA_ESTUDANTIL":
        return "outline";
      case "CENTRO_ACADEMICO":
        return "secondary";
      case "ATLETICA":
        return "outline";
      case "EMPRESA":
        return "default";
      default:
        return "destructive";
    }
  };

  const handleClick = () => {
    trackEvent("entidade_viewed", {
      properties: {
        entidade_name: entidade.name as string,
        entidade_type: entidade.tipo as TipoEntidade,
      },
    });
  };

  return (
    <Link href={`/entidade/${entidade.slug}`} onClick={handleClick}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image on the left */}
            <div className="flex-shrink-0 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entidade.imagePath || ""}
                alt={entidade.name}
                className="w-20 h-20 object-contain rounded"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>

            {/* Content on the right */}
            <div className="flex-1 min-w-0">
              {/* Name with badge */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-lg font-semibold truncate flex-1">{entidade.name}</h3>
                <Badge variant={getBadgeVariant()} className="flex-shrink-0">
                  {getBadgeText()}
                </Badge>
              </div>

              {/* Description */}
              {entidade.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{entidade.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EntidadesPage() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntidades = async () => {
      try {
        const data = await entidadesService.getAll();
        setEntidades(data);
      } catch (error) {
        console.error("Error fetching entidades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntidades();
  }, []);

  // Group entidades by tipo per requested sections
  // Sort by order (lower numbers first), then alphabetically by name
  const sortEntidades = (a: Entidade, b: Entidade) => {
    // If both have order, sort by order
    if (a.order !== null && a.order !== undefined && b.order !== null && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only a has order, it comes first
    if (a.order !== null && a.order !== undefined) {
      return -1;
    }
    // If only b has order, it comes first
    if (b.order !== null && b.order !== undefined) {
      return 1;
    }
    // If neither has order, sort alphabetically
    return a.name.localeCompare(b.name);
  };

  const laboratorios = entidades.filter(e => e.tipo === "LABORATORIO").sort(sortEntidades);

  const gruposELigas = entidades
    .filter(
      e => e.tipo === "GRUPO_ESTUDANTIL" || e.tipo === "LIGA_ESTUDANTIL" || e.tipo === "OUTRO"
    )
    .sort(sortEntidades);

  const centrosEAtleticas = entidades
    .filter(e => e.tipo === "CENTRO_ACADEMICO" || e.tipo === "ATLETICA")
    .sort(sortEntidades);

  const empresasParceiras = entidades.filter(e => e.tipo === "EMPRESA").sort(sortEntidades);

  return (
    <div className="container mx-auto p-4 pt-12">
      <h1 className="text-3xl font-bold mb-8 max-w-[50%]">
        Procure Laboratórios, ligas acadêmicas, grupos de pesquisa e outros
      </h1>

      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Laboratórios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Laboratórios */}
          {laboratorios.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Laboratórios</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {laboratorios.map(entidade => (
                  <EntidadeCard key={entidade.id} entidade={entidade} />
                ))}
              </div>
            </div>
          )}

          {/* Grupos e Ligas (inclui Outros) */}
          {gruposELigas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Grupos e Ligas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gruposELigas.map(entidade => (
                  <EntidadeCard key={entidade.id} entidade={entidade} />
                ))}
              </div>
            </div>
          )}

          {/* Centros Acadêmicos e Atléticas */}
          {centrosEAtleticas.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Centros Acadêmicos e Atléticas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {centrosEAtleticas.map(entidade => (
                  <EntidadeCard key={entidade.id} entidade={entidade} />
                ))}
              </div>
            </div>
          )}

          {/* Empresas Parceiras */}
          {empresasParceiras.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Empresas Parceiras</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {empresasParceiras.map(entidade => (
                  <EntidadeCard key={entidade.id} entidade={entidade} />
                ))}
              </div>
            </div>
          )}

          {entidades.length === 0 && (
            <p className="text-center text-muted-foreground">Nenhuma entidade encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}
