"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { entidadesService } from "@/lib/api/entidades";
import { Entidade } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Mail, Instagram, Linkedin, MapPin, Globe } from "lucide-react";

export default function EntidadeDetailPage({ params }: { params: { slug: string } }) {
  const [entidade, setEntidade] = useState<Entidade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Sobre" | "Pessoas">("Sobre");

  useEffect(() => {
    if (params.slug) {
      const fetchEntidade = async () => {
        try {
          const data = await entidadesService.getBySlug(params.slug);
          if (!data) {
            throw new Error("Entidade não encontrada");
          }
          setEntidade(data);
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
      fetchEntidade();
    }
  }, [params.slug]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error || !entidade) {
    return (
      <div className="container mx-auto p-4 pt-24 text-center text-red-500">
        {error || "Entidade não encontrada."}
      </div>
    );
  }

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
    <div className="mt-20">
      {/* Header Section */}
      <div className="flex w-full justify-between h-auto my-20 pt-5 px-[100px] items-center">
        <div className="flex flex-col max-w-[400px] gap-5 pt-[50px]">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg">
            <Image
              className="object-cover"
              src={entidade.imagePath || "/placeholder.png"}
              alt={`Foto de ${entidade.name}`}
              fill
            />
          </div>
          <h1 className="text-4xl font-bold">{entidade.name}</h1>
          <Badge variant={getBadgeVariant()} className="w-fit">
            {entidade.tipo.replace("_", " ")}
          </Badge>
          {entidade.description && (
            <p className="text-lg font-light text-muted-foreground">{entidade.description}</p>
          )}
          <div className="flex gap-10 text-sm text-muted-foreground">
            <p>{entidade.people.length} Pessoa(s)</p>
          </div>

          {/* Location */}
          {entidade.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{entidade.location}</span>
            </div>
          )}

          {/* Contact Links */}
          <div className="flex gap-4 pt-2">
            {entidade.contato_email && (
              <a
                href={`mailto:${entidade.contato_email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            )}
            {entidade.instagram && (
              <a
                href={`https://instagram.com/${entidade.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
            )}
            {entidade.linkedin && (
              <a
                href={`https://linkedin.com/company/${entidade.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            )}
            {entidade.website && (
              <a
                href={entidade.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex">
        <div className="w-full h-[10vh] pl-12 flex gap-12 justify-start items-center pt-5">
          <div
            className={`transition-all duration-200 py-2 px-10 rounded-full flex items-center cursor-pointer ${
              activeTab === "Sobre"
                ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-400 border-[1px]"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800  hover:border-neutral-300 border-transparent border-[1px]"
            }`}
            onClick={() => setActiveTab("Sobre")}
          >
            Sobre
          </div>
          <div
            className={`transition-all duration-200 py-2 px-10 rounded-full flex items-center cursor-pointer ${
              activeTab === "Pessoas"
                ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-400 border-[1px]"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-800  hover:border-neutral-300 border-transparent border-[1px]"
            }`}
            onClick={() => setActiveTab("Pessoas")}
          >
            Pessoas
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-slate-400 opacity-40"></div>

      {/* Content */}
      <div className="h-auto p-12">
        {activeTab === "Sobre" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Descrição</h2>
            <p className="text-muted-foreground">
              {entidade.description || "Nenhuma descrição fornecida."}
            </p>
          </div>
        )}
        {activeTab === "Pessoas" && (
          <div>
            {entidade.people.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {entidade.people.map((person, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-lg mb-1">{person.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{person.role}</p>
                    <p className="text-xs text-muted-foreground mb-2">{person.profession}</p>
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {person.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Nenhuma pessoa cadastrada.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
