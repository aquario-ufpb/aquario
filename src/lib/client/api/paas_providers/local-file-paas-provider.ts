import { PaasCenterResponse } from "@/lib/shared/types";
import { PaasDataProvider } from "./paas-provider.interface";

// Import the local JSON file
declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    keys(): string[];
    (id: string): PaasCenterResponse | { default: PaasCenterResponse };
  };
};

const contentContext = require.context("../../../../../content/aquario-paas", true, /\.json$/);

export class LocalFilePaasProvider implements PaasDataProvider {
  private paasData: PaasCenterResponse | null = null;

  constructor() {
    // Load all JSON files at initialization (same pattern as entidades)
    const dataFiles = contentContext.keys();

    if (dataFiles.length > 0) {
      // Load the first JSON file found (you can make this more specific if needed)
      const dataFile = contentContext(dataFiles[0]) as
        | PaasCenterResponse
        | { default: PaasCenterResponse };
      this.paasData =
        "default" in dataFile && dataFile.default
          ? dataFile.default
          : (dataFile as PaasCenterResponse);
    }
  }

  getCenter(_centerId: string = "CI"): Promise<PaasCenterResponse> {
    if (!this.paasData) {
      throw new Error("Local PAAS data file not available");
    }

    // For now, we assume the local file contains data for the requested center
    // If you have multiple centers, you can extend this to filter by centerId
    return Promise.resolve(this.paasData);
  }
}
