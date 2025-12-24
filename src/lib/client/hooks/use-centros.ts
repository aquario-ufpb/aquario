import { useQuery } from "@tanstack/react-query";
import { centrosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

export const useCentros = () => {
  return useQuery({
    queryKey: queryKeys.centros.all,
    queryFn: centrosService.getAll,
  });
};
