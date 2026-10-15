import { PaasCenterResponse } from "@/lib/shared/types";
import { PaasDataProvider } from "./paas-provider.interface";
import { EXTERNAL_API_URLS } from "@/lib/shared/config/constants";

const TIMEOUT_MS = 5000; // 5 second timeout

export class ExternalPaasProvider implements PaasDataProvider {
  async getCenter(centerId: string = "CI"): Promise<PaasCenterResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${EXTERNAL_API_URLS.PAAS}?id=${encodeURIComponent(centerId)}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch PAAS center data: ${response.statusText}`);
      }
      const data: PaasCenterResponse = await response.json();
      if (
        data.sigla?.trim().toUpperCase() !== centerId.trim().toUpperCase() ||
        data.status !== "published" ||
        !Array.isArray(data.solution?.solution)
      ) {
        throw new Error("Invalid or unpublished PAAS allocation");
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}
