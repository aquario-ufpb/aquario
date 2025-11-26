import type { MapasDataProvider } from "./mapas-provider.interface";
import type { MapsData, Building } from "../../mapas/types";
import { loadFloorData } from "../../mapas/data-loader";

// Import layouts from aquario-mapas
import { floorSubsolo as ciFloorSubsoloLayout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/ci/floor-subsolo";
import { floorTerreo as ciFloorTerreoLayout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/ci/floor-terreo";
import { floor1 as ciFloor1Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/ci/floor-1";
import { floor2 as ciFloor2Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/ci/floor-2";
import { floor3 as ciFloor3Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/ci/floor-3";

// Import room data from aquario-mapas
import { rooms as ciRoomsSubsolo } from "../../../../content/aquario-mapas/centro-de-informatica/salas/ci/floor-subsolo";
import { rooms as ciRoomsTerreo } from "../../../../content/aquario-mapas/centro-de-informatica/salas/ci/floor-terreo";
import { rooms as ciRooms1 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/ci/floor-1";
import { rooms as ciRooms2 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/ci/floor-2";
import { rooms as ciRooms3 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/ci/floor-3";

// Import layouts from laser building
import { floor1 as laserFloor1Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/laser/floor-1";
import { floor2 as laserFloor2Layout } from "../../../../content/aquario-mapas/centro-de-informatica/mapas/laser/floor-2";

// Import room data from laser building
import { rooms as laserRooms1 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/laser/floor-1";
import { rooms as laserRooms2 } from "../../../../content/aquario-mapas/centro-de-informatica/salas/laser/floor-2";

export class LocalFileMapasProvider implements MapasDataProvider {
  getAll(): Promise<MapsData> {
    // Merge layout and room data for each floor
    const ciFloorSubsolo = loadFloorData(ciFloorSubsoloLayout, ciRoomsSubsolo);
    const ciFloorTerreo = loadFloorData(ciFloorTerreoLayout, ciRoomsTerreo);
    const ciFloor1 = loadFloorData(ciFloor1Layout, ciRooms1);
    const ciFloor2 = loadFloorData(ciFloor2Layout, ciRooms2);
    const ciFloor3 = loadFloorData(ciFloor3Layout, ciRooms3);

    // Create CI building with merged floors
    const building1: Building = {
      id: "centro-de-informatica",
      name: "CI",
      code: "CI",
      floors: [ciFloorSubsolo, ciFloorTerreo, ciFloor1, ciFloor2, ciFloor3],
    };

    // Merge layout and room data for laser building
    const laserFloor1 = loadFloorData(laserFloor1Layout, laserRooms1);
    const laserFloor2 = loadFloorData(laserFloor2Layout, laserRooms2);

    // Create laser building with merged floors
    const laserBuilding: Building = {
      id: "laser",
      name: "LASER",
      code: "LASER",
      floors: [laserFloor1, laserFloor2],
    };

    return Promise.resolve([building1, laserBuilding]);
  }
}
