import type { MapsData } from "@/lib/mapas/types";

export type MapasDataProvider = {
  getAll(): Promise<MapsData>;
};
