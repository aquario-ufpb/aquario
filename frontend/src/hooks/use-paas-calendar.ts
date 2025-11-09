import { useQuery } from "@tanstack/react-query";
import { paasService } from "../lib/api";
import { queryKeys } from "../lib/query-keys";

export const usePaasCalendar = (centerId: string = "CI") => {
  return useQuery({
    queryKey: queryKeys.paas.center(centerId),
    queryFn: () => paasService.getCenter(centerId),
  });
};
