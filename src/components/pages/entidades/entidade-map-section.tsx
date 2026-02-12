import { useMemo, useState } from "react";
import { Entidade } from "@/lib/shared/types";
import { useMapas } from "@/lib/client/hooks/use-mapas";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { isLabResearch } from "@/lib/client/mapas/utils";
import { InteractiveMap } from "@/components/pages/mapas/interactive-map";
import RoomDetailsDialog from "@/components/pages/mapas/room-details-dialog";
import { Room } from "@/lib/client/mapas/types";

type EntidadeMapSectionProps = {
  entidade: Entidade;
};

export function EntidadeMapSection({ entidade }: EntidadeMapSectionProps) {
  const { data: mapsData, isLoading } = useMapas();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const foundLocation = useMemo(() => {
    if (!mapsData) {
      return null;
    }

    for (const building of mapsData) {
      // Check if location matches building name
      if (building.name === entidade.name && building.floors.length > 0) {
        return { building, floor: null, room: null };
      }

      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          if (isLabResearch(room)) {
            if (room.labs?.includes(entidade.slug || "")) {
              return { building, floor, room };
            }
          }

          if (entidade.location && room.location === entidade.location) {
            return { building, floor, room };
          }
        }
      }
    }
    return null;
  }, [mapsData, entidade.slug, entidade.location, entidade.name]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (!mapsData && !isLoading) {
    return (
      <div className="px-6 md:px-8 lg:px-16 py-6 border-t border-border/40">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
            <MapPin className="h-5 w-5" />
            <p className="text-sm font-medium">
              Não foi possível carregar o mapa desta entidade no momento.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!foundLocation) {
    if (entidade.location) {
      return null;
    }
    return null;
  }

  const { building, floor: foundFloor, room: foundRoom } = foundLocation;

  const currentFloorId = selectedFloorId || foundFloor?.id;
  const displayFloor = building.floors.find(f => f.id === currentFloorId) || foundFloor;

  const handleRoomClick = (room: Room) => {
    setSelectedRoomId(room.id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="px-6 md:px-8 lg:px-16 py-8 border-t border-border/40">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Localização
          </h2>
          <p className="text-muted-foreground">
            {building.name} {displayFloor?.name ? `• ${displayFloor.name}` : ""}{" "}
            {foundRoom ? `• Sala ${foundRoom.location}` : ""}
          </p>
        </div>

        <InteractiveMap
          building={building}
          initialFloorId={foundFloor?.id || undefined}
          selectedFloorId={currentFloorId}
          onFloorChange={setSelectedFloorId}
          highlightedRoomId={foundRoom?.id}
          isDark={isDark}
          onRoomClick={handleRoomClick}
        />
      </div>

      <RoomDetailsDialog
        room={displayFloor?.rooms.find(r => r.id === selectedRoomId) || null}
        buildingId={building.id}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        isDark={isDark}
      />
    </div>
  );
}
