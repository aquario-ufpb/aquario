import { useQuery } from "@tanstack/react-query";
import { cursosService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

// Cursos data is very static - 30 minutes staleTime
const THIRTY_MINUTES = 30 * 60 * 1000;

export const useCursos = (centroId: string) => {
  return useQuery({
    queryKey: queryKeys.cursos.byCentro(centroId),
    queryFn: () => cursosService.getByCentro(centroId),
    enabled: !!centroId,
    staleTime: THIRTY_MINUTES,
  });
};
