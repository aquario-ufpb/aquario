"use client";

import React from "react";
import type { Room, EntidadeSlug } from "@/lib/mapas/types";
import type { Entidade } from "@/lib/shared/types/entidade.types";
import { getRoomCenter, getRoomColors, getTextDimensions } from "./blueprint-utils";
import { RoomShapeEdges } from "./room-shape-edges";
import { RoomLabel } from "./room-label";

type RoomGroupProps = {
  room: Room;
  isDark: boolean;
  isHovered: boolean;
  highlightedRoomId?: string | null;
  onHover: (id: string | null) => void;
  onClick: (room: Room) => void;
  entidadesMap?: Map<EntidadeSlug, Entidade>;
};

export function RoomGroup({
  room,
  isDark,
  isHovered,
  highlightedRoomId,
  onHover,
  onClick,
  entidadesMap,
}: RoomGroupProps) {
  const isCorridor = room.type === "corridor";
  const isHighlighted = highlightedRoomId === room.id;
  const { fillColor, strokeColor } = getRoomColors(isCorridor, isHovered || isHighlighted, isDark);
  const { centerX, centerY } = getRoomCenter(room);
  const { fontSize, subtitleFontSize, textWidth, textHeight, showIcon } = getTextDimensions(
    room,
    entidadesMap
  );

  return (
    <g key={room.id}>
      {/* Render all shapes for this room with fill only */}
      {room.shapes.map((shape, shapeIndex) => (
        <rect
          key={shapeIndex}
          x={shape.position.x}
          y={shape.position.y}
          width={shape.size.width}
          height={shape.size.height}
          fill={fillColor}
          stroke="none"
          className={isCorridor ? "pointer-events-none" : "cursor-pointer transition-all"}
          onClick={
            isCorridor
              ? undefined
              : event => {
                  event.stopPropagation();
                  onClick(room);
                }
          }
          onMouseEnter={isCorridor ? undefined : () => onHover(room.id)}
          onMouseLeave={isCorridor ? undefined : () => onHover(null)}
        />
      ))}

      {/* Render only non-shared edge segments as strokes - skip for corridors */}
      {!isCorridor &&
        room.shapes.map((shape, shapeIndex) => (
          <RoomShapeEdges
            key={`edges-${shapeIndex}`}
            shape={shape}
            shapeIndex={shapeIndex}
            allShapes={room.shapes}
            strokeColor={strokeColor}
            strokeWidth={isHovered ? 2 : 1}
          />
        ))}

      {/* Room label (centered on all shapes) - skip for corridors */}
      {!isCorridor && (
        <RoomLabel
          room={room}
          centerX={centerX}
          centerY={centerY}
          fontSize={fontSize}
          subtitleFontSize={subtitleFontSize}
          textWidth={textWidth}
          textHeight={textHeight}
          isDark={isDark}
          entidadesMap={entidadesMap}
          showIcon={showIcon}
        />
      )}
    </g>
  );
}
