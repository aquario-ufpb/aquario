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
      <div className="container mx-auto p-4 pt-12 text-center text-red-500">
        {error || "Entidade não encontrada."}
      </div>
    );
  }

  const getBadgeVariant = () => {
    switch (entidade.tipo) {
      case "LABORATORIO":
        return "default";
      case "GRUPO_ESTUDANTIL":
        return "secondary";
      case "LIGA_ESTUDANTIL":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <div className="mt-0">
      {/* Main Content Section - Two Columns */}
      <div className="container mx-auto px-4 md:px-8 lg:px-16 pt-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Image and Details */}
          <div className="flex flex-col gap-6">
            {/* Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg mx-auto lg:mx-0">
              <Image
                className="object-cover"
                src={entidade.imagePath || "/placeholder.png"}
                alt={`Foto de ${entidade.name}`}
                fill
              />
            </div>

            {/* Name and Badge */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{entidade.name}</h1>
              <Badge variant={getBadgeVariant()} className="w-fit">
                {entidade.tipo.replace("_", " ")}
              </Badge>
            </div>

            {/* People Count */}
            <div className="flex gap-10 text-sm text-muted-foreground justify-center lg:justify-start">
              <p>{entidade.people.length} Pessoa(s)</p>
            </div>

            {/* Location */}
            {entidade.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center lg:justify-start">
                <MapPin className="w-4 h-4" />
                <span>{entidade.location}</span>
              </div>
            )}

            {/* Contact Links */}
            <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
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

          {/* Right Column: Description */}
          <div className="flex flex-col justify-start">
            <h2 className="text-2xl font-semibold mb-4">Descrição</h2>
            <p className="text-muted-foreground leading-relaxed">
              {entidade.description || "Nenhuma descrição fornecida."}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-slate-400 opacity-40"></div>

      {/* People Section */}
      <div className="container mx-auto px-4 md:px-8 lg:px-16 py-8">
        <h2 className="text-2xl font-semibold mb-6">Pessoas</h2>
        {entidade.people.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {entidade.people.map((person, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
    </div>
  );
}
