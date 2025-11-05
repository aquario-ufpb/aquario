"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { entidadesService } from "@/lib/api/entidades";
import { Entidade, TipoEntidade } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Instagram, Linkedin, MapPin, Globe, ArrowLeft } from "lucide-react";
import { trackEvent } from "@/analytics/posthog-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EntidadeDetailPage({ params }: { params: { slug: string } }) {
  const [entidade, setEntidade] = useState<Entidade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherEntidades, setOtherEntidades] = useState<Entidade[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (params.slug) {
      const fetchEntidade = async () => {
        try {
          const data = await entidadesService.getBySlug(params.slug);
          if (!data) {
            throw new Error("Entidade não encontrada");
          }
          setEntidade(data);

          // Fetch other entities of the same type
          const allEntidades = await entidadesService.getAll();
          const filtered = allEntidades
            .filter(e => e.tipo === data.tipo && e.slug !== data.slug)
            .slice(0, 8); // Limit to 8 similar entities
          setOtherEntidades(filtered);
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

  const handleInstagramClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name as string,
      entidade_type: entidade.tipo as TipoEntidade,
      link_type: "instagram",
    });
  };

  const handleLinkedinClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name as string,
      entidade_type: entidade.tipo as TipoEntidade,
      link_type: "linkedin",
    });
  };

  const handleWebsiteClick = () => {
    trackEvent("entidade_link_clicked", {
      entidade_name: entidade.name as string,
      entidade_type: entidade.tipo as TipoEntidade,
      link_type: "website",
    });
  };
  const getBadgeText = (tipo: string) => {
    switch (tipo) {
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

  return (
    <div className="mt-24">
      {/* Back Button */}
      <div className="container mx-auto px-6 md:px-8 lg:px-16 pt-8 pb-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 md:px-8 lg:px-16 pt-4 pb-8">
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-12">
              {/* Image */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-border/50">
                  <Image
                    className="object-cover"
                    src={entidade.imagePath || "/placeholder.png"}
                    alt={`Logo de ${entidade.name}`}
                    fill
                  />
                </div>
              </div>

              {/* Main Info */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
                      {entidade.name}
                    </h1>
                    <Badge variant={getBadgeVariant()} className="mb-4">
                      {entidade.tipo.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                {entidade.location && (
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{entidade.location}</span>
                    </div>
                  </div>
                )}

                {/* Contact Links */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {entidade.contato_email && (
                    <a
                      href={`mailto:${entidade.contato_email}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors text-sm"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors text-sm"
                      onClick={handleInstagramClick}
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors text-sm"
                      onClick={handleLinkedinClick}
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors text-sm"
                      onClick={handleWebsiteClick}
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description Section */}
      {entidade.description && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-8">
          <Card className="border-border/50">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-semibold mb-6">Descrição</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {entidade.description}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* People Section */}
      {entidade.people.length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-4">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">Pessoas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entidade.people.map((person, index) => (
              <Card
                key={index}
                className="hover:bg-accent/20 transition-all duration-200 border-border/50"
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{person.name}</h3>
                  {person.role && (
                    <p className="text-sm font-medium text-foreground mb-1">{person.role}</p>
                  )}
                  {person.profession && (
                    <p className="text-xs text-muted-foreground mb-3">{person.profession}</p>
                  )}
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {person.email}
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {otherEntidades.length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 mt-10 mb-10">
          <div className="w-full h-[1px] bg-border opacity-50"></div>
        </div>
      )}

      {/* Other Entities of Same Type */}
      {otherEntidades.length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">
            Outros {entidade.tipo.replace("_", " ").toLowerCase()}s
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherEntidades.map(otherEntidade => (
              <Link key={otherEntidade.id} href={`/entidade/${otherEntidade.slug}`}>
                <Card className="hover:bg-accent/20 transition-all duration-200 cursor-pointer h-full border-border/50">
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0 flex items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={otherEntidade.imagePath || ""}
                          alt={otherEntidade.name}
                          className="w-16 h-16 object-contain rounded-lg"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate flex-1">
                            {otherEntidade.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-0.5 text-muted-foreground border-muted-foreground/30 flex-shrink-0 font-normal"
                          >
                            {getBadgeText(otherEntidade.tipo)}
                          </Badge>
                        </div>

                        {otherEntidade.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {otherEntidade.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
