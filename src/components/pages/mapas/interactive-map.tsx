"use client";

import React, { useState } from "react";
import { Building, Room } from "@/lib/client/mapas/types";
import BlueprintViewer from "@/components/pages/mapas/blueprint-viewer";
import { MapFloorSelector } from "@/components/pages/mapas/map-floor-selector";

type InteractiveMapProps = {
  building: Building;
  initialFloorId?: string;
  selectedFloorId?: string;
  onFloorChange?: (floorId: string) => void;
  highlightedRoomId?: string;
  isDark?: boolean;
  onRoomClick: (room: Room) => void;
  onBackgroundClick?: () => void;
  compact?: boolean;
  selectorLabel?: string;
  className?: string;
};

export function InteractiveMap({
  building,
  initialFloorId,
  selectedFloorId: controlledSelectedFloorId,
  onFloorChange,
  highlightedRoomId,
  isDark = false,
  onRoomClick,
  onBackgroundClick,
  compact = false,
  selectorLabel,
  className,
}: InteractiveMapProps) {
  const [internalSelectedFloorId, setInternalSelectedFloorId] = useState<string | null>(
    initialFloorId || building.floors[0]?.id || null
  );

  const isControlled = controlledSelectedFloorId !== undefined;
  const effectiveSelectedFloorId = isControlled
    ? controlledSelectedFloorId
    : internalSelectedFloorId;

  const handleFloorChange = (id: string) => {
    if (!isControlled) {
      setInternalSelectedFloorId(id);
    }
    onFloorChange?.(id);
  };

  const displayFloor =
    building.floors.find(f => f.id === effectiveSelectedFloorId) || building.floors[0];

  if (!displayFloor) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-6 mt-6 ${className || ""}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-shrink-0 self-end md:self-auto ml-auto">
          <MapFloorSelector
            building={building}
            selectedFloorId={displayFloor.id}
            onSelectFloor={handleFloorChange}
            isDark={isDark}
            roomFloorId={initialFloorId}
            label={selectorLabel}
          />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card relative p-4 md:p-10 min-h-[fit-content] flex items-center justify-center">
        <BlueprintViewer
          floor={displayFloor}
          onRoomClick={onRoomClick}
          isDark={isDark}
          highlightedRoomId={displayFloor.id === initialFloorId ? highlightedRoomId : undefined}
          onBackgroundClick={onBackgroundClick}
          compact={compact}
        />
      </div>
    </div>
  );
}
