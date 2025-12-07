"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntidadeBySlug, useEntidades } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { TipoEntidade, getPeopleFromEntidade } from "@/lib/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Instagram, Linkedin, MapPin, Globe, ArrowLeft, Edit } from "lucide-react";
import { trackEvent } from "@/analytics/posthog-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { EditarEntidadeDialog } from "@/components/pages/entidades/editar-entidade-dialog";
import { isUserAdminOfEntidade } from "@/lib/types/membro.types";
import { useBackend } from "@/lib/config/env";

export default function EntidadeDetailPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const { isEnabled: backendEnabled } = useBackend();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use React Query hooks
  const { data: entidade, isLoading, error: queryError } = useEntidadeBySlug(params.slug);
  const { data: allEntidades = [] } = useEntidades();

  // Compute other entidades of the same type
  const otherEntidades = useMemo(() => {
    if (!entidade) {
      return [];
    }
    return allEntidades
      .filter(e => e.tipo === entidade.tipo && e.slug !== entidade.slug)
      .slice(0, 8); // Limit to 8 similar entities
  }, [entidade, allEntidades]);

  // Check if user can edit this entidade (only if backend is enabled)
  const canEdit =
    backendEnabled &&
    user &&
    (user.papelPlataforma === "MASTER_ADMIN" || isUserAdminOfEntidade(user.id, entidade?.membros));

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (queryError || !entidade) {
    const errorMessage =
      queryError instanceof Error ? queryError.message : "Entidade não encontrada.";
    return (
      <div className="container mx-auto p-4 pt-12 text-center text-red-500">{errorMessage}</div>
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
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                  )}
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
                      href={`${entidade.instagram}`}
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
                      href={`${entidade.linkedin}`}
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
      {getPeopleFromEntidade(entidade).length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-4">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">Pessoas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getPeopleFromEntidade(entidade).map((person, index) => (
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

      {/* Edit Dialog */}
      {entidade && (
        <EditarEntidadeDialog
          entidade={entidade}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={newSlug => {
            // If slug changed, redirect to new URL
            if (newSlug && newSlug !== params.slug) {
              router.push(`/entidade/${newSlug}`);
            } else {
              // Otherwise, invalidate and refetch entidade data
              queryClient.invalidateQueries({ queryKey: queryKeys.entidades.bySlug(params.slug) });
            }
          }}
        />
      )}
    </div>
  );
}
