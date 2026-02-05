import { useQuery } from "@tanstack/react-query";
import { guiasService } from "@/lib/client/api";
import { queryKeys } from "@/lib/client/query-keys";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useGuias = () => {
  return useQuery({
    queryKey: queryKeys.guias.all,
    queryFn: () => guiasService.getAll(),
    staleTime: FIVE_MINUTES,
  });
};

export const useSecoes = (guiaSlug: string) => {
  return useQuery({
    queryKey: queryKeys.guias.secoes(guiaSlug),
    queryFn: () => guiasService.getSecoes(guiaSlug),
    enabled: !!guiaSlug,
    staleTime: FIVE_MINUTES,
  });
};

export const useSubSecoes = (secaoSlug: string) => {
  return useQuery({
    queryKey: queryKeys.guias.subSecoes(secaoSlug),
    queryFn: () => guiasService.getSubSecoes(secaoSlug),
    enabled: !!secaoSlug,
    staleTime: FIVE_MINUTES,
  });
};
