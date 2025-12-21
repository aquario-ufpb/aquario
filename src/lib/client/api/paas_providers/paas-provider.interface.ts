import { PaasCenterResponse } from "@/lib/shared/types";

export type PaasDataProvider = {
  getCenter(centerId: string): Promise<PaasCenterResponse>;
};
