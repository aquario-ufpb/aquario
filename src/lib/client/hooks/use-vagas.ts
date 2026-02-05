import { useQuery } from "@tanstack/react-query";
import { vagasService } from "@/lib/client/api/vagas";
import { queryKeys } from "@/lib/client/query-keys";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useVagas = () => {
  return useQuery({
    queryKey: queryKeys.vagas.all,
    queryFn: () => vagasService.getAll(),
    staleTime: FIVE_MINUTES,
  });
};

export const useVagaById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.vagas.byId(id),
    queryFn: () => vagasService.getById(id),
    enabled: !!id,
    staleTime: FIVE_MINUTES,
  });
};
