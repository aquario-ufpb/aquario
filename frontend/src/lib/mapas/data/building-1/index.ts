import type { Building } from "../../types";
import { floor as floor1 } from "./floor-1";
import { floor as floor2 } from "./floor-2";
import { floor as floor3 } from "./floor-3";
import { floorTerreo } from "./floor-terreo";
import { floorSubsolo } from "./floor-subsolo";

export const building1: Building = {
  id: "centro-de-informatica",
  name: "CI",
  code: "CI",
  floors: [floorSubsolo, floorTerreo, floor1, floor2, floor3],
};
