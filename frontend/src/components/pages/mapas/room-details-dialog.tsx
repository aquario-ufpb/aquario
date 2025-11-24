"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Info, Ruler } from "lucide-react";
import Link from "next/link";
import type { Room } from "@/lib/mapas/types";
import { formatProfessorsForDetails, isLabResearch, isProfessorOffice } from "@/lib/mapas/utils";
import { entidadesService } from "@/lib/api/entidades";
import type { Entidade } from "@/lib/types/entidade.types";

type RoomDetailsDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
};

export default function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
  isDark,
}: RoomDetailsDialogProps) {
  const [labEntidades, setLabEntidades] = useState<Entidade[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);

  useEffect(() => {
    const loadLabEntidades = async () => {
      if (!room || !isLabResearch(room) || !room.labs || room.labs.length === 0) {
        setLabEntidades([]);
        setIsLoadingLabs(false);
        return;
      }

      setIsLoadingLabs(true);
      try {
        const labs = room.labs;
        const entidades = await Promise.all(labs.map(slug => entidadesService.getBySlug(slug)));

        setLabEntidades(entidades.filter((e): e is Entidade => e !== null));
      } catch (error) {
        console.error("Error loading lab entities:", error);
        setLabEntidades([]);
      } finally {
        setIsLoadingLabs(false);
      }
    };

    if (open && room) {
      loadLabEntidades();
    } else {
      // Reset when dialog closes
      setLabEntidades([]);
      setIsLoadingLabs(false);
    }
  }, [room, open]);

  if (!room) {
    return null;
  }

  const hasCapacity = (room: Room): room is Room & { capacity: number } => {
    return (
      (room.type === "classroom" && "capacity" in room && room.capacity !== undefined) ||
      (room.type === "lab-class" && "capacity" in room && room.capacity !== undefined) ||
      (room.type === "lab-research" && "capacity" in room && room.capacity !== undefined) ||
      (room.type === "library" && "capacity" in room && room.capacity !== undefined) ||
      (room.type === "shared-space" && "capacity" in room && room.capacity !== undefined)
    );
  };

  const capacity = hasCapacity(room) ? room.capacity : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? "bg-gray-900 border-white/20" : "bg-white border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            <MapPin className="w-5 h-5" />
            {room.location}
          </DialogTitle>
        </DialogHeader>

        <div
          className={`p-4 rounded-lg border mt-4 ${
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          }`}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            Informações da Sala
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin
                  className="w-4 h-4 mt-1 flex-shrink-0"
                  style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                />
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                  >
                    Tipo
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      isDark
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }
                  >
                    {room.type}
                  </Badge>
                </div>
              </div>

              {capacity !== undefined && (
                <div className="flex items-start gap-2">
                  <Users
                    className="w-4 h-4 mt-1 flex-shrink-0"
                    style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                  />
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                    >
                      Capacidade
                    </p>
                    <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{capacity} pessoas</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Ruler
                  className="w-4 h-4 mt-1 flex-shrink-0"
                  style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                />
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                  >
                    Forma
                  </p>
                  <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                    {room.shapes.length} segmento{room.shapes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isLabResearch(room) && room.labs && room.labs.length > 0 && (
                <div>
                  <p
                    className="text-xs mb-3"
                    style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                  >
                    Laboratórios
                  </p>
                  <div className="space-y-2">
                    {isLoadingLabs ? (
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        Carregando laboratórios...
                      </p>
                    ) : labEntidades.length > 0 ? (
                      labEntidades.map(entidade => (
                        <Link
                          key={entidade.slug}
                          href={`/entidade/${entidade.slug}`}
                          className="block"
                        >
                          <Card
                            className={`hover:bg-accent/20 transition-all duration-200 cursor-pointer border-border/90 ${
                              isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                            }`}
                          >
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                {/* Image on the left */}
                                <div className="flex-shrink-0 flex items-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={entidade.imagePath || ""}
                                    alt={entidade.name}
                                    className="w-12 h-12 object-contain rounded-lg"
                                    onError={e => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>

                                {/* Content on the right */}
                                <div className="flex-1 min-w-0">
                                  {/* Name with badge */}
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4
                                      className="text-sm font-semibold truncate flex-1"
                                      style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                                    >
                                      {entidade.name}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs px-2 py-0.5 flex-shrink-0 font-normal ${
                                        isDark
                                          ? "text-muted-foreground border-muted-foreground/30"
                                          : "text-muted-foreground border-muted-foreground/30"
                                      }`}
                                    >
                                      LAB
                                    </Badge>
                                  </div>

                                  {/* Description */}
                                  {entidade.description && (
                                    <p
                                      className="text-xs line-clamp-2 leading-relaxed"
                                      style={{
                                        color: isDark ? "#E5F6FF/80" : "#0e3a6c/80",
                                      }}
                                    >
                                      {entidade.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        Nenhum laboratório encontrado.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isProfessorOffice(room) && room.professors && room.professors.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users
                    className="w-4 h-4 mt-1 flex-shrink-0"
                    style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                  />
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                    >
                      Professores
                    </p>
                    <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                      {formatProfessorsForDetails(room.professors)}
                    </p>
                  </div>
                </div>
              )}

              {room.description && (
                <div className="flex items-start gap-2">
                  <Info
                    className="w-4 h-4 mt-1 flex-shrink-0"
                    style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                  />
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                    >
                      Descrição
                    </p>
                    <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{room.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
