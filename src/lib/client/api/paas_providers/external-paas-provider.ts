import { PaasCenterResponse } from "@/lib/shared/types";
import { PaasDataProvider } from "./paas-provider.interface";
import { EXTERNAL_API_URLS } from "@/lib/shared/config/constants";

const TIMEOUT_MS = 5000; // 5 second timeout

export class ExternalPaasProvider implements PaasDataProvider {
  async getCenter(centerId: string = "CI"): Promise<PaasCenterResponse> {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("External PAAS API request timed out"));
      }, TIMEOUT_MS);
    });

    // Race between fetch and timeout
    const response = await Promise.race([
      fetch(`${EXTERNAL_API_URLS.PAAS}?id=${centerId}`),
      timeoutPromise,
    ]);

    if (!response.ok) {
      throw new Error(`Failed to fetch PAAS center data: ${response.statusText}`);
    }

    return response.json();
  }
}
