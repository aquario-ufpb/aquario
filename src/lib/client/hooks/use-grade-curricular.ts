import { useQuery } from "@tanstack/react-query";
import { curriculosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

const THIRTY_MINUTES = 30 * 60 * 1000;

export const useGradeCurricular = (cursoId: string | null) => {
  return useQuery({
    queryKey: queryKeys.curriculos.grade(cursoId ?? ""),
    queryFn: () => curriculosService.getGradeByCurso(cursoId as string),
    enabled: !!cursoId,
    staleTime: THIRTY_MINUTES,
  });
};
