import { useQuery } from "@tanstack/react-query";
import { entidadesService } from "@/lib/client/api/entidades";
import { queryKeys } from "@/lib/client/query-keys";
import { TipoEntidade } from "@/lib/shared/types/entidade.types";

export const useEntidades = () => {
  return useQuery({
    queryKey: queryKeys.entidades.all,
    queryFn: () => entidadesService.getAll(),
  });
};

export const useEntidadeBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.entidades.bySlug(slug),
    queryFn: () => entidadesService.getBySlug(slug),
    enabled: !!slug,
  });
};

export const useEntidadesByTipo = (tipo: TipoEntidade) => {
  return useQuery({
    queryKey: queryKeys.entidades.byTipo(tipo),
    queryFn: () => entidadesService.getByTipo(tipo),
    enabled: !!tipo,
  });
};
