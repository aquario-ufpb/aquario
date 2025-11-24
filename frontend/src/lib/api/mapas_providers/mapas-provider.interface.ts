import type { MapsData } from "../../mapas/types";

export type MapasDataProvider = {
  getAll(): Promise<MapsData>;
};
