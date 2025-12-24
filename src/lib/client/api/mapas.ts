import type { MapsData } from "@/lib/mapas/types";
import { LocalFileMapasProvider } from "./mapas_providers/local-file-mapas-provider";

const provider = new LocalFileMapasProvider();

export const mapasService = {
  getAll: async (): Promise<MapsData> => {
    return await provider.getAll();
  },
};
