import { useQuery } from "@tanstack/react-query";
import { centrosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

// Centros data is very static - 30 minutes staleTime
const THIRTY_MINUTES = 30 * 60 * 1000;

export const useCentros = () => {
  return useQuery({
    queryKey: queryKeys.centros.all,
    queryFn: centrosService.getAll,
    staleTime: THIRTY_MINUTES,
  });
};
