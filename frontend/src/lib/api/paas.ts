import { PaasCenterResponse } from "../types";

const PAAS_API_URL = "https://sa.ci.ufpb.br/api/paas/center";

export const paasService = {
  getCenter: async (centerId: string = "CI"): Promise<PaasCenterResponse> => {
    const response = await fetch(`${PAAS_API_URL}?id=${centerId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch PAAS center data");
    }
    return response.json();
  },
};
