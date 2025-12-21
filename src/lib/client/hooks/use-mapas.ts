import { useQuery } from "@tanstack/react-query";
import { mapasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

export const useMapas = () => {
  return useQuery({
    queryKey: queryKeys.mapas.all,
    queryFn: () => mapasService.getAll(),
  });
};
