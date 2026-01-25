"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit } from "lucide-react";
import { Entidade } from "@/lib/shared/types";
import { EntidadeContactLinks } from "./entidade-contact-links";
import { getBadgeVariant, formatEntityType } from "./entidade-utils";

type EntidadeHeroSectionProps = {
  entidade: Entidade;
  canEdit: boolean;
  onEditClick: () => void;
};

export function EntidadeHeroSection({ entidade, canEdit, onEditClick }: EntidadeHeroSectionProps) {
  return (
    <div className="px-6 md:px-8 lg:px-16 pt-4 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-12">
        {/* Image */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border border-border/30 shadow-sm">
            <Image
              className="object-cover"
              src={entidade.imagePath || "/placeholder.png"}
              alt={`Logo de ${entidade.name}`}
              fill
            />
          </div>
        </div>

        {/* Main Info */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{entidade.name}</h1>
              <Badge variant={getBadgeVariant(entidade.tipo)} className="text-xs">
                {formatEntityType(entidade.tipo)}
              </Badge>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
          </div>

          {/* Location */}
          {entidade.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{entidade.location}</span>
            </div>
          )}

          {/* Contact Links */}
          <EntidadeContactLinks entidade={entidade} />
        </div>
      </div>
    </div>
  );
}
