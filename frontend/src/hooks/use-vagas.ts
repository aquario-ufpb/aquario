import { useQuery } from "@tanstack/react-query";
import { vagasService } from "../lib/api/vagas";
import { queryKeys } from "../lib/query-keys";

export const useVagas = () => {
  return useQuery({
    queryKey: queryKeys.vagas.all,
    queryFn: () => vagasService.getAll(),
  });
};

export const useVagaById = (id: string) => {
  return useQuery({
    queryKey: queryKeys.vagas.byId(id),
    queryFn: () => vagasService.getById(id),
    enabled: !!id,
  });
};
