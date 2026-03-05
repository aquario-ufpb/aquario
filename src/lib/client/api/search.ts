import { ENDPOINTS } from "@/lib/shared/config/constants";
import { throwApiError } from "@/lib/client/errors";
import { apiClient } from "./api-client";
import type { SearchResponse } from "@/lib/shared/types/search.types";

export const searchService = {
  search: async (query: string, limit = 5): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await apiClient(`${ENDPOINTS.SEARCH}?${params}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },
};
