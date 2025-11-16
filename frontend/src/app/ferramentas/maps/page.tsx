"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Layers } from "lucide-react";
import BlueprintViewer3D from "@/components/pages/maps/blueprint-viewer-3d";
import RoomDetailsDialog from "@/components/pages/maps/room-details-dialog";
import { mapsData } from "@/lib/maps";
import type { Room } from "@/lib/maps/types";

export default function MapsPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Track selected floor per building: buildingId -> floorId
  const [selectedFloors, setSelectedFloors] = useState<Record<string, string>>({});
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-select first floor of each building on mount
    const initialSelections: Record<string, string> = {};
    mapsData.forEach(building => {
      if (building.floors.length > 0) {
        initialSelections[building.id] = building.floors[0].id;
      }
    });
    setSelectedFloors(initialSelections);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDialogOpen(true);
  };

  const handleFloorClick = (buildingId: string, floorId: string) => {
    setSelectedFloors(prev => ({
      ...prev,
      [buildingId]: floorId,
    }));
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
      {/* Header */}
      <div className="mb-12">
        <h1
          className="text-4xl md:text-5xl font-display font-bold mb-4"
          style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
        >
          Mapas dos Prédios
        </h1>
        <p className="text-lg md:text-xl" style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
          Explore os mapas dos prédios do Centro de Informática
        </p>
      </div>

      {/* Buildings List */}
      <div className="space-y-16">
        {mapsData.map(building => (
          <div key={building.id} className="space-y-6 md:px-8 lg:px-64 sm:px-0">
            {/* Building Header */}
            <div className="space-y-2 flex flex-col items-center">
              <div
                className="flex items-center gap-2 text-2xl md:text-3xl font-semibold"
                style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
              >
                <Building2 className="w-6 h-6" />
                {building.name}
                {building.code && (
                  <span
                    className="text-lg font-normal opacity-80"
                    style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                  >
                    ({building.code})
                  </span>
                )}
              </div>
            </div>

            {/* Floor Buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers
                  className="w-4 h-4"
                  style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                >
                  Andares:
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {building.floors.map(floor => {
                  const isSelected = selectedFloors[building.id] === floor.id;
                  return (
                    <Button
                      key={floor.id}
                      onClick={() => handleFloorClick(building.id, floor.id)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      style={
                        isSelected
                          ? {
                              backgroundColor: isDark ? "#1a3a5c" : "#0e3a6c",
                              color: isDark ? "#C8E6FA" : "#fff",
                            }
                          : {
                              borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                              color: isDark ? "#C8E6FA" : "#0e3a6c",
                              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                            }
                      }
                    >
                      {floor.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Blueprint Viewer for Selected Floor */}
            {selectedFloors[building.id] && (
              <div className="mt-8">
                {(() => {
                  const selectedFloorId = selectedFloors[building.id];
                  const selectedFloor = building.floors.find(f => f.id === selectedFloorId);
                  return selectedFloor ? (
                    <BlueprintViewer3D
                      floor={selectedFloor}
                      onRoomClick={handleRoomClick}
                      isDark={isDark}
                    />
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Room Details Dialog */}
      <RoomDetailsDialog
        room={selectedRoom}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isDark={isDark}
      />
    </div>
  );
}
