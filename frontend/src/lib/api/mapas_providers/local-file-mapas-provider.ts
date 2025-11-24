import type { MapasDataProvider } from "./mapas-provider.interface";
import type { MapsData, Building } from "../../mapas/types";
import { loadFloorData } from "../../mapas/data-loader";

// Import layouts from aquario-mapas
import { floorSubsolo as floorSubsoloLayout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/building-1/floor-subsolo";
import { floorTerreo as floorTerreoLayout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/building-1/floor-terreo";
import { floor1 as floor1Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/building-1/floor-1";
import { floor2 as floor2Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/building-1/floor-2";
import { floor3 as floor3Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/building-1/floor-3";

// Import room data from aquario-mapas
import { rooms as roomsSubsolo } from "../../../../content/aquario-mapas/centro-de-informatica/salas/building-1/floor-subsolo";
import { rooms as roomsTerreo } from "../../../../content/aquario-mapas/centro-de-informatica/salas/building-1/floor-terreo";
import { rooms as rooms1 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/building-1/floor-1";
import { rooms as rooms2 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/building-1/floor-2";
import { rooms as rooms3 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/building-1/floor-3";

export class LocalFileMapasProvider implements MapasDataProvider {
  getAll(): Promise<MapsData> {
    // Merge layout and room data for each floor
    const floorSubsolo = loadFloorData(floorSubsoloLayout, roomsSubsolo);
    const floorTerreo = loadFloorData(floorTerreoLayout, roomsTerreo);
    const floor1 = loadFloorData(floor1Layout, rooms1);
    const floor2 = loadFloorData(floor2Layout, rooms2);
    const floor3 = loadFloorData(floor3Layout, rooms3);

    // Create building with merged floors
    const building1: Building = {
      id: "centro-de-informatica",
      name: "CI",
      code: "CI",
      floors: [floorSubsolo, floorTerreo, floor1, floor2, floor3],
    };

    return Promise.resolve([building1]);
  }
}
