"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, Calendar } from "lucide-react";
import { Entidade } from "@/lib/shared/types";
import { EntidadeContactLinks } from "./entidade-contact-links";
import { getBadgeVariant, formatEntityType } from "./entidade-utils";

type EntidadeHeroSectionProps = {
  entidade: Entidade;
  canEdit: boolean;
  onEditClick: () => void;
};

function formatFoundingYear(date: string | null | undefined): string | null {
  if (!date) {
    return null;
  }
  // Parse the year portion directly. `new Date("YYYY-MM-DD")` is interpreted
  // as UTC midnight; in negative-offset timezones `.getFullYear()` rolls back
  // to the previous local day (and potentially year). String parse avoids the
  // round-trip through Date entirely.
  const match = /^(\d{4})/.exec(date);
  if (!match) {
    const parsed = new Date(date);
    const fallback = parsed.getUTCFullYear();
    return Number.isNaN(fallback) ? null : String(fallback);
  }
  return match[1];
}

export function EntidadeHeroSection({ entidade, canEdit, onEditClick }: EntidadeHeroSectionProps) {
  const foundingYear = formatFoundingYear(entidade.founding_date);

  return (
    <div className="pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-10 items-start">
        {/* Logo */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-white">
            <Image
              className="object-contain p-3"
              src={entidade.imagePath || "/placeholder.png"}
              alt={`Logo de ${entidade.name}`}
              fill
            />
          </div>
        </div>

        {/* Main info */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 truncate">{entidade.name}</h1>
              {entidade.subtitle && (
                <p className="text-muted-foreground text-base mb-3">{entidade.subtitle}</p>
              )}
              <Badge variant={getBadgeVariant(entidade.tipo)} className="text-xs">
                {formatEntityType(entidade.tipo)}
              </Badge>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="flex items-center gap-2 self-start"
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

          {/* Contact links */}
          <EntidadeContactLinks entidade={entidade} />

          {/* Stats row */}
          {foundingYear && (
            <div className="flex flex-wrap items-center gap-6 pt-3 mt-1 border-t border-border/30 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  <strong className="font-semibold">{foundingYear}</strong>{" "}
                  <span className="text-muted-foreground">fundada</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
