"use client";

import React from "react";
import WcIcon from "@mui/icons-material/Wc";
import {
  ArrowUpDown,
  BookOpen,
  Building2,
  Info,
  Library,
  Monitor,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Room, EntidadeSlug } from "@/lib/client/mapas/types";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import {
  formatLabsForDisplay,
  formatProfessorsForDisplay,
  isLabResearch,
  isProfessorOffice,
} from "@/lib/client/mapas/utils";

type RoomLabelProps = {
  room: Room;
  centerX: number;
  centerY: number;
  fontSize: number;
  subtitleFontSize: number;
  textWidth: number;
  textHeight: number;
  isDark: boolean;
  entidadesMap?: Map<EntidadeSlug, Entidade>;
  showIcon: boolean;
};

export function RoomLabel({
  room,
  centerX,
  centerY,
  fontSize,
  subtitleFontSize,
  textWidth,
  textHeight,
  isDark,
  entidadesMap,
  showIcon,
}: RoomLabelProps) {
  if (room.type === "bathroom") {
    return (
      <foreignObject
        x={centerX - 14}
        y={centerY - 14}
        width="28"
        height="28"
        className="pointer-events-none"
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "rgba(241,245,249,0.5)",
          }}
        >
          <WcIcon
            sx={{
              fontSize: 16,
              color: isDark ? "#C8E6FA" : "#0e3a6c",
            }}
          />
        </div>
      </foreignObject>
    );
  }

  const textColor = isDark ? "#C8E6FA" : "#0e3a6c";

  // Determine which icon to show based on room type
  let RoomIcon: LucideIcon | null = null;
  switch (room.type) {
    case "lab-class":
      RoomIcon = Monitor;
      break;
    case "lab-research":
      RoomIcon = Search;
      break;
    case "classroom":
      RoomIcon = BookOpen;
      break;
    case "library":
      RoomIcon = Library;
      break;
    case "professor-office":
      RoomIcon = Users;
      break;
    case "institutional-office":
      RoomIcon = Building2;
      break;
    case "shared-space":
      RoomIcon = Users;
      break;
    case "stairs":
      RoomIcon = ArrowUpDown;
      break;
    default:
      RoomIcon = Info;
  }

  const textStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    textAlign: "center" as const,
    color: textColor,
    lineHeight: "1.2",
    wordWrap: "break-word" as const,
    overflowWrap: "break-word" as const,
    overflow: "hidden" as const,
  };

  // Determine what to display: labs, professors (first names), or location
  const hasLabs = isLabResearch(room) && room.labs && room.labs.length > 0;
  // Get entidades for labs if available
  const labEntidades =
    hasLabs && isLabResearch(room) && room.labs && entidadesMap
      ? room.labs
          .map(slug => entidadesMap.get(slug))
          .filter((entidade): entidade is Entidade => entidade !== undefined)
      : [];
  const hasLabLogos = labEntidades.some(entidade => Boolean(entidade.imagePath));

  const hasProfessorsCheck =
    isProfessorOffice(room) && room.professors && room.professors.length > 0;
  const displayText =
    hasLabs && isLabResearch(room) && room.labs
      ? formatLabsForDisplay(room.labs, entidadesMap)
      : hasProfessorsCheck && isProfessorOffice(room) && room.professors
        ? formatProfessorsForDisplay(room.professors)
        : room.location;
  const subtitleText = hasLabs || hasProfessorsCheck ? room.location : undefined;

  if (hasProfessorsCheck || hasLabs) {
    return (
      <foreignObject
        x={centerX - textWidth / 2}
        y={centerY - textHeight / 2}
        width={textWidth}
        height={textHeight}
        className="pointer-events-none"
      >
        <div style={textStyle}>
          {/* Display entidade logos for labs */}
          {hasLabLogos && (
            <div
              style={{
                marginBottom: "4px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
                flexWrap: "wrap",
              }}
            >
              {labEntidades.map(entidade => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={entidade.slug}
                  src={entidade.imagePath || ""}
                  alt={entidade.name}
                  style={{
                    width: `${Math.min(fontSize * 1.5, 32)}px`,
                    height: `${Math.min(fontSize * 1.5, 32)}px`,
                    objectFit: "contain",
                    borderRadius: "50%",
                  }}
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ))}
            </div>
          )}
          {/* Display icon if applicable (only if no lab logos) */}
          {RoomIcon && showIcon && !hasLabLogos && (
            <div style={{ marginBottom: "4px", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: Math.round(fontSize * 1.8),
                  height: Math.round(fontSize * 1.8),
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "rgba(241,245,249,0.5)",
                }}
              >
                <RoomIcon size={Math.round(fontSize * 1.1)} color={textColor} strokeWidth={2} />
              </div>
            </div>
          )}
          {/* Display title (professors first names or room title) */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 600,
              marginBottom: "2px",
            }}
          >
            {displayText}
          </div>
          {/* Display name as subtitle if there's a title or professors */}
          {subtitleText && (
            <div
              style={{
                fontSize: `${subtitleFontSize}px`,
                fontWeight: 400,
                marginTop: "2px",
              }}
            >
              {subtitleText}
            </div>
          )}
        </div>
      </foreignObject>
    );
  }

  // Display name only (with icon if applicable)
  return (
    <foreignObject
      x={centerX - textWidth / 2}
      y={centerY - textHeight / 2}
      width={textWidth}
      height={textHeight}
      className="pointer-events-none"
    >
      <div style={textStyle}>
        {/* Display entidade logos for labs */}
        {hasLabLogos && (
          <div
            style={{
              marginBottom: "4px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            {labEntidades.map(entidade => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={entidade.slug}
                src={entidade.imagePath || ""}
                alt={entidade.name}
                style={{
                  width: `${Math.min(fontSize * 1.5, 32)}px`,
                  height: `${Math.min(fontSize * 1.5, 32)}px`,
                  objectFit: "contain",
                }}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ))}
          </div>
        )}
        {/* Display icon if applicable (only if no lab logos) */}
        {RoomIcon && showIcon && !hasLabLogos && (
          <div style={{ marginBottom: "4px", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: Math.round(fontSize * 1.8),
                height: Math.round(fontSize * 1.8),
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(15,23,42,0.4)" : "rgba(241,245,249,0.5)",
              }}
            >
              <RoomIcon size={Math.round(fontSize * 1.1)} color={textColor} strokeWidth={2} />
            </div>
          </div>
        )}
        {/* Display name (or professors first names) */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 600,
          }}
        >
          {displayText || room.location}
        </div>
      </div>
    </foreignObject>
  );
}
