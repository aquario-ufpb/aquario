import type { Building } from "../../types";
import { floor } from "./floor-1";
import { floorTerreo } from "./floor-terreo";
import { floorSubsolo } from "./floor-subsolo";

export const building1: Building = {
  id: "centro-de-informatica",
  name: "CI",
  code: "CI",
  floors: [floorSubsolo, floorTerreo, floor],
};
