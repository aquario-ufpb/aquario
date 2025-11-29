import { PaasCenterResponse } from "../types";
import { ExternalPaasProvider } from "./paas_providers/external-paas-provider";
import { LocalFilePaasProvider } from "./paas_providers/local-file-paas-provider";

const externalProvider = new ExternalPaasProvider();
const localProvider = new LocalFilePaasProvider();

export const paasService = {
  getCenter: async (centerId: string = "CI"): Promise<PaasCenterResponse> => {
    // Always try external API first, fallback to local if it fails
    try {
      const data = await externalProvider.getCenter(centerId);
      return data;
    } catch (error) {
      // If external API fails, try local file
      try {
        const data = await localProvider.getCenter(centerId);
        return data;
      } catch (localError) {
        // If both fail, throw the original external API error
        throw new Error(
          `Failed to fetch PAAS data from both external API and local file. External API error: ${error instanceof Error ? error.message : String(error)}. Local file error: ${localError instanceof Error ? localError.message : String(localError)}`
        );
      }
    }
  },
};
