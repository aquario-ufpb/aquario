"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Info, User } from "lucide-react";
import Link from "next/link";
import type { Room } from "@/lib/mapas/types";
import { isLabResearch, isProfessorOffice } from "@/lib/mapas/utils";
import { entidadesService } from "@/lib/api/entidades";
import type { Entidade } from "@/lib/types/entidade.types";
import { getProfessorsByIds } from "@/lib/mapas/professors-directory";
import { usePaasCalendar } from "@/hooks";
import type { ClassWithRoom } from "@/components/pages/calendario/types";
import type { PaasRoom } from "@/lib/types";
import { RoomWeeklySchedule } from "./room-weekly-schedule";

type RoomDetailsDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
};

export default function RoomDetailsDialog(props: RoomDetailsDialogProps) {
  const { room, open, onOpenChange, isDark } = props;
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

  const { data: calendarData } = usePaasCalendar("CI");

  const allClassesForCenter = useMemo<ClassWithRoom[]>(() => {
    const classes: ClassWithRoom[] = [];
    const solutionRooms = calendarData?.solution?.solution as PaasRoom[] | undefined;
    if (!solutionRooms) {
      return classes;
    }

    solutionRooms.forEach((paasRoom: PaasRoom) => {
      if (paasRoom.classes && paasRoom.classes.length > 0) {
        paasRoom.classes.forEach(classItem => {
          classes.push({
            ...classItem,
            room: {
              bloco: paasRoom.bloco,
              nome: paasRoom.nome,
            },
          });
        });
      }
    });

    return classes;
  }, [calendarData]);

  const normalizeRoomKey = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

  const currentRoomKey = room ? normalizeRoomKey(room.location) : "";

  const classesForThisRoom = useMemo(
    () =>
      allClassesForCenter.filter(classItem => {
        if (!room) {
          return false;
        }
        const key = normalizeRoomKey(`${classItem.room.bloco} ${classItem.room.nome}`);
        return key === currentRoomKey;
      }),
    [allClassesForCenter, currentRoomKey, room]
  );

  const uniqueClassCount = useMemo(
    () => new Set(classesForThisRoom.map(cls => cls.id)).size,
    [classesForThisRoom]
  );

  if (!room) {
    return null;
  }

  const professorProfiles =
    isProfessorOffice(room) && room.professors && room.professors.length > 0
      ? getProfessorsByIds(room.professors)
      : [];

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
  const primaryLabEntidade =
    isLabResearch(room) && labEntidades.length > 0 ? labEntidades[0] : null;
  const isLabRoom = isLabResearch(room) && room.labs && room.labs.length > 0;
  const isProfessorRoom = isProfessorOffice(room) && room.professors && room.professors.length > 0;
  const hasLoadedLabs = Boolean(primaryLabEntidade);
  const titleText = primaryLabEntidade ? primaryLabEntidade.name : room.location;
  const subtitleText = primaryLabEntidade ? room.location : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-md sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden ${
          isDark ? "bg-gray-900 border-white/20" : "bg-white border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            <MapPin className="w-5 h-5" />
            <span className="flex flex-col">
              <span>{titleText}</span>
              {subtitleText && (
                <span
                  className="text-xs opacity-80"
                  style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}
                >
                  {subtitleText}
                </span>
              )}
            </span>
          </DialogTitle>
        </DialogHeader>

        <RoomDetailsContainer
          isDark={isDark}
          title={hasLoadedLabs ? "Informações do laboratório" : "Informações da sala"}
        >
          {hasLoadedLabs && primaryLabEntidade ? (
            // Lab loaded: focus the modal entirely on the entidade card
            <EntidadeMainSection entidade={primaryLabEntidade} isDark={isDark} />
          ) : (
            <>
              {/* Professors and labs are primary content. Order them by room type. */}
              {isProfessorRoom && (
                <RoomProfessorsSection
                  room={room}
                  isDark={isDark}
                  professorProfiles={professorProfiles}
                />
              )}

              {isLabRoom && (
                <RoomLabsSection
                  room={room}
                  isDark={isDark}
                  isLoadingLabs={isLoadingLabs}
                  labEntidades={labEntidades}
                />
              )}

              {/* For non-professor / non-lab rooms, still show any labs/profs if present, but after type */}
              {!isProfessorRoom && !isLabRoom && (
                <>
                  <RoomSummaryColumn
                    room={room}
                    capacity={capacity}
                    classCount={uniqueClassCount}
                    isDark={isDark}
                  />
                  <RoomProfessorsSection
                    room={room}
                    isDark={isDark}
                    professorProfiles={professorProfiles}
                  />
                  <RoomLabsSection
                    room={room}
                    isDark={isDark}
                    isLoadingLabs={isLoadingLabs}
                    labEntidades={labEntidades}
                  />
                </>
              )}

              {/* For professor / lab rooms, show the generic summary after the primary content */}
              {(isProfessorRoom || isLabRoom) && (
                <RoomSummaryColumn
                  room={room}
                  capacity={capacity}
                  classCount={uniqueClassCount}
                  isDark={isDark}
                />
              )}

              <RoomDescriptionSection room={room} isDark={isDark} />

              {/* Weekly schedule for this room when we have matching classes */}
              {classesForThisRoom.length > 0 && (
                <RoomWeeklySchedule classes={classesForThisRoom} isDark={isDark} />
              )}
            </>
          )}
        </RoomDetailsContainer>
      </DialogContent>
    </Dialog>
  );
}

type RoomDetailsContainerProps = {
  isDark: boolean;
  title: string;
  children: React.ReactNode;
};

function RoomDetailsContainer({ isDark, title, children }: RoomDetailsContainerProps) {
  return (
    <div className={`mt-4 space-y-4 ${isDark ? "" : ""}`}>
      <h3 className="text-lg font-semibold" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

type RoomSummaryColumnProps = {
  room: Room;
  capacity: number | undefined;
  classCount: number;
  isDark: boolean;
};

function RoomSummaryColumn({ room, capacity, classCount, isDark }: RoomSummaryColumnProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left column: tipo + capacidade */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin
            className="w-4 h-4 mt-1 flex-shrink-0"
            style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
          />
          <div>
            <p className="text-xs mb-1" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
              Tipo de espaço
            </p>
            <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{getRoomTypeLabel(room)}</p>
          </div>
        </div>

        {capacity !== undefined && (
          <div className="flex items-start gap-2">
            <Users
              className="w-4 h-4 mt-1 flex-shrink-0"
              style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
            />
            <div>
              <p className="text-xs mb-1" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
                Capacidade
              </p>
              <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{capacity} pessoas</p>
            </div>
          </div>
        )}
      </div>

      {/* Right column: turmas no SACI */}
      <div className="space-y-3 md:text-right">
        <div className="flex items-start gap-2 md:justify-end">
          <Info
            className="w-4 h-4 mt-1 flex-shrink-0"
            style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
          />
          <div>
            <p
              className="text-xs mb-1 text-left"
              style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
            >
              Turmas no SACI
            </p>
            <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
              {classCount > 0
                ? `${classCount} turma${classCount > 1 ? "s" : ""}`
                : "Nenhuma turma registrada"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type RoomLabsSectionProps = {
  room: Room;
  isDark: boolean;
  isLoadingLabs: boolean;
  labEntidades: Entidade[];
};

function RoomLabsSection({ room, isDark, isLoadingLabs, labEntidades }: RoomLabsSectionProps) {
  if (!isLabResearch(room) || !room.labs || room.labs.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
        Laboratórios
      </p>
      <div className="space-y-2">
        {isLoadingLabs ? (
          <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>Carregando laboratórios...</p>
        ) : labEntidades.length > 0 ? (
          labEntidades.map(entidade => (
            <Link key={entidade.slug} href={`/entidade/${entidade.slug}`} className="block">
              <Card
                className={`hover:bg-accent/20 transition-all duration-200 cursor-pointer border-border/90 ${
                  isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
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
                    <div className="flex-1 min-w-0">
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
        ) : null}
      </div>
    </div>
  );
}

type EntidadeMainSectionProps = {
  entidade: Entidade;
  isDark: boolean;
};

function EntidadeMainSection({ entidade, isDark }: EntidadeMainSectionProps) {
  return (
    <Link href={`/entidade/${entidade.slug}`} className="block">
      <Card
        className={`cursor-pointer transition-all duration-200 hover:bg-accent/20 border-border/90 ${
          isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entidade.imagePath || ""}
                alt={entidade.name}
                className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4
                  className="text-base md:text-lg font-semibold truncate flex-1"
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
              {entidade.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}
                >
                  {entidade.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

type RoomProfessorsSectionProps = {
  room: Room;
  isDark: boolean;
  professorProfiles: ReturnType<typeof getProfessorsByIds>;
};

function RoomProfessorsSection({ room, isDark, professorProfiles }: RoomProfessorsSectionProps) {
  if (!isProfessorOffice(room) || !room.professors || room.professors.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-start gap-2">
        <Users
          className="w-4 h-4 mt-1 flex-shrink-0"
          style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
        />
        <p className="text-xs mb-1" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
          Professores
        </p>
      </div>
      <div className="mt-2 space-y-2">
        {professorProfiles.length > 0 ? (
          professorProfiles.map(professor => (
            <Card
              key={professor.id}
              className={`border-border/90 ${
                isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
              }`}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {professor.image ? (
                      <ProfessorImageWithFallback
                        src={professor.image}
                        alt={professor.name}
                        isDark={isDark}
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                          isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
                        }`}
                      >
                        <User
                          className="w-6 h-6"
                          style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                          strokeWidth={1.8}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-sm font-semibold"
                        style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                      >
                        {professor.name}
                      </h4>
                      {professor.sigaa && (
                        <Link
                          href={professor.sigaa}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/SIGAA-horizontal.png"
                            alt="SIGAA"
                            className="h-5 w-auto object-contain"
                          />
                        </Link>
                      )}
                    </div>
                    {professor.department && (
                      <p
                        className="text-xs"
                        style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}
                      >
                        {professor.department}
                      </p>
                    )}
                    {professor.room && (
                      <p className="text-xs text-muted-foreground">Sala {professor.room}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
            Informações dos professores indisponíveis.
          </p>
        )}
      </div>
    </div>
  );
}

type RoomDescriptionSectionProps = {
  room: Room;
  isDark: boolean;
};

function RoomDescriptionSection({ room, isDark }: RoomDescriptionSectionProps) {
  // For professor rooms we don't show the description at all
  if (isProfessorOffice(room)) {
    return null;
  }

  if (!room.description) {
    return null;
  }

  return (
    <div className="flex items-start gap-2">
      <Info
        className="w-4 h-4 mt-1 flex-shrink-0"
        style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
      />
      <div>
        <p className="text-xs mb-1" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
          Descrição
        </p>
        <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{room.description}</p>
      </div>
    </div>
  );
}

function getRoomTypeLabel(room: Room): string {
  switch (room.type) {
    case "classroom":
      return "Sala de aula";
    case "lab-class":
      return "Laboratório de aula";
    case "lab-research":
      return "Laboratório de pesquisa";
    case "professor-office":
      return "Sala de professores";
    case "institutional-office":
      return "Sala administrativa";
    case "bathroom":
      return "Banheiro";
    case "corridor":
      return "Corredor";
    case "stairs":
      return "Escadas";
    case "library":
      return "Biblioteca";
    case "shared-space":
      return "Espaço compartilhado";
    default:
      return room.type;
  }
}

type ProfessorImageWithFallbackProps = {
  src: string;
  alt: string;
  isDark: boolean;
};

function ProfessorImageWithFallback({ src, alt, isDark }: ProfessorImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center border ${
          isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
        }`}
      >
        <User
          className="w-6 h-6"
          style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          strokeWidth={1.8}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-12 h-12 rounded-full object-cover border border-border/50"
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}
