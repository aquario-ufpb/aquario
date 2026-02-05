import { useQuery } from "@tanstack/react-query";
import { mapasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useMapas = () => {
  return useQuery({
    queryKey: queryKeys.mapas.all,
    queryFn: () => mapasService.getAll(),
    staleTime: FIVE_MINUTES,
  });
};
