"use client";

import React from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Building, Floor } from "@/lib/client/mapas/types";

type MapFloorSelectorProps = {
  building: Building;
  selectedFloorId: string | null;
  onSelectFloor: (floorId: string) => void;
  isDark: boolean;
  roomFloorId?: string | null;
  label?: string;
};

export function MapFloorSelector({
  building,
  selectedFloorId,
  onSelectFloor,
  isDark,
  roomFloorId,
  label = "Andares:",
}: MapFloorSelectorProps) {
  const effectiveSelectedId = selectedFloorId ?? building.floors[0]?.id ?? null;

  if (!building.floors.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4" style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }} />
        <p className="text-sm font-medium" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
          {label}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {building.floors.map((floor: Floor) => {
          const isSelected = effectiveSelectedId === floor.id;
          const isRoomFloor = roomFloorId === floor.id;
          const baseLightBg = "#fff";
          const baseDarkBg = "rgba(255,255,255,0.05)";

          let style: React.CSSProperties;
          if (isSelected) {
            style = {
              backgroundColor: isDark ? "#1a3a5c" : "#0e3a6c",
              color: isDark ? "#C8E6FA" : "#fff",
            };
          } else if (isRoomFloor) {
            style = {
              borderColor: isDark ? "#3b82f6" : "#2563eb",
              color: isDark ? "#bfdbfe" : "#1d4ed8",
              backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "rgba(59,130,246,0.08)",
            };
          } else {
            style = {
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
              color: isDark ? "#C8E6FA" : "#0e3a6c",
              backgroundColor: isDark ? baseDarkBg : baseLightBg,
            };
          }

          return (
            <Button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              style={style}
            >
              {floor.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
