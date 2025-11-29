import { PaasCenterResponse } from "../../types";

export type PaasDataProvider = {
  getCenter(centerId: string): Promise<PaasCenterResponse>;
};
