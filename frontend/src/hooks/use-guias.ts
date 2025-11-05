import { useQuery } from "@tanstack/react-query";
import { guiasService } from "../lib/api";
import { queryKeys } from "../lib/query-keys";

export const useGuias = () => {
  return useQuery({
    queryKey: queryKeys.guias.all,
    queryFn: () => guiasService.getAll(),
  });
};

export const useSecoes = (guiaSlug: string) => {
  return useQuery({
    queryKey: queryKeys.guias.secoes(guiaSlug),
    queryFn: () => guiasService.getSecoes(guiaSlug),
    enabled: !!guiaSlug,
  });
};

export const useSubSecoes = (secaoSlug: string) => {
  return useQuery({
    queryKey: queryKeys.guias.subSecoes(secaoSlug),
    queryFn: () => guiasService.getSubSecoes(secaoSlug),
    enabled: !!secaoSlug,
  });
};
