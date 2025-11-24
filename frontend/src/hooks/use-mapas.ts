import { useQuery } from "@tanstack/react-query";
import { mapasService } from "../lib/api";
import { queryKeys } from "../lib/query-keys";

export const useMapas = () => {
  return useQuery({
    queryKey: queryKeys.mapas.all,
    queryFn: () => mapasService.getAll(),
  });
};
