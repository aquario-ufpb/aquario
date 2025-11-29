"use client";

import React, { useState } from "react";
import type { Floor, Room } from "@/lib/mapas/types";
import { RoomGroup } from "./room-group";
import { useBlueprintScale } from "./use-blueprint-scale";
import { useEntidadesMap } from "./use-entidades-map";

type BlueprintViewerProps = {
  floor: Floor;
  onRoomClick: (room: Room) => void;
  isDark: boolean;
};

export default function BlueprintViewer({ floor, onRoomClick, isDark }: BlueprintViewerProps) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const { blueprint, rooms } = floor;

  const entidadesMap = useEntidadesMap(rooms);
  const { scaledWidth, scaledHeight } = useBlueprintScale(blueprint);

  return (
    <div className="w-full overflow-auto">
      <div className="flex justify-center items-center" style={{ minHeight: "100%" }}>
        <svg
          width={scaledWidth}
          height={scaledHeight}
          viewBox={`0 0 ${blueprint.width} ${blueprint.height}`}
          className="border rounded"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
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
