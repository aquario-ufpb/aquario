"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Layers } from "lucide-react";
import BuildingViewer3D from "@/components/pages/maps/building-viewer-3d";
import RoomDetailsDialog from "@/components/pages/maps/room-details-dialog";
import { mapsData } from "@/lib/maps";
import type { Room } from "@/lib/maps/types";

export default function MapsPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDialogOpen(true);
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
          <div key={building.id} className="space-y-6">
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

            {/* 3D Building Viewer */}
            <div className="mt-8">
              <BuildingViewer3D building={building} onRoomClick={handleRoomClick} isDark={isDark} />
            </div>
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
