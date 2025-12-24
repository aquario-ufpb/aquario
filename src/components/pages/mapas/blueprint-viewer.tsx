"use client";

import React, { useState } from "react";
import type { Floor, Room } from "@/lib/client/mapas/types";
import { RoomGroup } from "./room-group";
import { useBlueprintScale } from "./use-blueprint-scale";
import { useEntidadesMap } from "./use-entidades-map";

type BlueprintViewerProps = {
  floor: Floor;
  onRoomClick: (room: Room) => void;
  isDark: boolean;
  highlightedRoomId?: string | null;
  onBackgroundClick?: () => void;
  compact?: boolean;
};

export default function BlueprintViewer({
  floor,
  onRoomClick,
  isDark,
  highlightedRoomId,
  onBackgroundClick,
  compact = false,
}: BlueprintViewerProps) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const { blueprint, rooms } = floor;

  const entidadesMap = useEntidadesMap(rooms);
  const { scaledWidth, scaledHeight } = useBlueprintScale(blueprint, { compact });

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex justify-center items-center" style={{ minHeight: "100%" }}>
        <svg
          width={scaledWidth}
          height={scaledHeight}
          viewBox={`0 0 ${blueprint.width} ${blueprint.height}`}
          className="border rounded"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
            maxWidth: "100%",
            height: "auto",
          }}
          onClick={event => {
            if (event.target === event.currentTarget) {
              onBackgroundClick?.();
            }
          }}
        >
          {/* Background image if available */}
          {blueprint.backgroundImage && (
            <image
              href={blueprint.backgroundImage}
              x="0"
              y="0"
              width={blueprint.width}
              height={blueprint.height}
              opacity={0.3}
            />
          )}

          {/* Render rooms */}
          {rooms.map(room => (
            <RoomGroup
              key={room.id}
              room={room}
              isDark={isDark}
              isHovered={hoveredRoomId === room.id}
              highlightedRoomId={highlightedRoomId}
              onHover={setHoveredRoomId}
              onClick={onRoomClick}
              entidadesMap={entidadesMap}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
