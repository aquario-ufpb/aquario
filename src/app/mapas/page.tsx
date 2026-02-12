"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { InteractiveMap } from "@/components/pages/mapas/interactive-map";
import RoomDetailsDialog from "@/components/pages/mapas/room-details-dialog";
import { useMapas } from "@/lib/client/hooks/use-mapas";
import type { Room } from "@/lib/client/mapas/types";
import { ContributeOnGitHub } from "@/components/shared/contribute-on-github";

function MapsPageInner() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: mapsData, isLoading, error } = useMapas();
  // Track selected floor per building: buildingId -> floorId
  const [selectedFloors, setSelectedFloors] = useState<Record<string, string>>({});
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const predioParam = searchParams?.get("predio")?.toLowerCase() ?? null;
  const pisoParam = searchParams?.get("piso");
  const salaParam = searchParams?.get("sala") ?? null;
  const floorsInitializedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mapsData || floorsInitializedRef.current) {
      return;
    }

    const initialSelections: Record<string, string> = {};
    mapsData.forEach(building => {
      if (building.floors.length === 0) {
        return;
      }

      const isTargetBuilding =
        predioParam && building.code?.toLowerCase() === predioParam.toLowerCase();
      let selectedFloor = building.floors[0];

      if (isTargetBuilding && pisoParam !== null) {
        const pisoIndex = Number(pisoParam);
        if (!Number.isNaN(pisoIndex) && building.floors[pisoIndex]) {
          selectedFloor = building.floors[pisoIndex];
        }
      }

      initialSelections[building.id] = selectedFloor.id;
    });

    setSelectedFloors(initialSelections);
    floorsInitializedRef.current = true;
  }, [mapsData, predioParam, pisoParam]);

  useEffect(() => {
    setHighlightedRoomId(salaParam);
  }, [salaParam]);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const handleRoomClick = (room: Room, buildingId: string) => {
    // Any explicit room click clears URL-based highlight state
    setHighlightedRoomId(null);
    setSelectedRoom(room);
    setSelectedBuildingId(buildingId);
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

  if (isLoading) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Carregando mapas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg text-red-500">
            Erro ao carregar mapas. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!mapsData || mapsData.length === 0) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Nenhum mapa disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold max-w-3xl">
            Mapas dos Prédios
          </h1>
          <div className="hidden md:flex flex-shrink-0">
            <ContributeOnGitHub
              url="https://github.com/aquario-ufpb/aquario-mapas"
              className="rounded-full hover:bg-primary/90 transition-all text-white dark:text-black font-normal"
            />
          </div>
        </div>
      </div>

      {/* Buildings List */}
      <div className="space-y-16">
        {mapsData.map(building => (
          <div key={building.id} className="space-y-6 md:px-8 lg:px-64 sm:px-0 mb-16">
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

            {/* Interactive Map Component */}
            <InteractiveMap
              building={building}
              selectedFloorId={selectedFloors[building.id] || building.floors[0]?.id}
              initialFloorId={building.floors[0]?.id}
              onFloorChange={floorId => handleFloorClick(building.id, floorId)}
              highlightedRoomId={highlightedRoomId ?? undefined}
              isDark={isDark}
              onRoomClick={room => handleRoomClick(room, building.id)}
              onBackgroundClick={() => setHighlightedRoomId(null)}
            />
          </div>
        ))}
      </div>

      {/* Room Details Dialog */}
      <RoomDetailsDialog
        room={selectedRoom}
        buildingId={selectedBuildingId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isDark={isDark}
      />
    </div>
  );
}

export default function MapsPage() {
  // Wrap in Suspense so useSearchParams is allowed during prerender
  return (
    <Suspense
      fallback={
        <div className="w-full px-4 md:px-8 lg:px-12 mt-24 pb-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg">Carregando mapas...</p>
          </div>
        </div>
      }
    >
      <MapsPageInner />
    </Suspense>
  );
}
