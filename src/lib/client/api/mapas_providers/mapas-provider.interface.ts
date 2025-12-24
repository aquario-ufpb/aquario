import type { MapsData } from "@/lib/client/mapas/types";

export type MapasDataProvider = {
  getAll(): Promise<MapsData>;
};
