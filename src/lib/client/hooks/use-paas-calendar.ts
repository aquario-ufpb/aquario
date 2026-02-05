import { useQuery } from "@tanstack/react-query";
import { paasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

// Calendar data updates infrequently - 10 minutes staleTime
const TEN_MINUTES = 10 * 60 * 1000;

export const usePaasCalendar = (centerId: string = "CI") => {
  return useQuery({
    queryKey: queryKeys.paas.center(centerId),
    queryFn: () => paasService.getCenter(centerId),
    staleTime: TEN_MINUTES,
    refetchOnWindowFocus: false, // Expensive query, don't refetch on focus
  });
};
