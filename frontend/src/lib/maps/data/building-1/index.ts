import type { Building } from "../../types";
import { floor } from "./floor";
import { floorTerreo } from "./floor-terreo";

export const building1: Building = {
  id: "centro-de-informatica",
  name: "CI",
  code: "CI",
  floors: [floorTerreo, floor],
};
