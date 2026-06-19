import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import { updateProjeto, updateProjetoAutores } from "@/lib/client/api/projetos";
import type {
  UpdateProjetoInput,
  UpdateProjetoAutoresInput,
} from "@/lib/shared/validations/projetos";

/** PATCH /api/projetos/[slug] — updates projeto fields (does NOT touch autores). */
export const useUpdateProjeto = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjetoInput) => updateProjeto(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.bySlug(slug) });
    },
  });
};

/** PUT /api/projetos/[slug]/autores — replaces the full author list. */
export const useUpdateProjetoAutores = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjetoAutoresInput) => updateProjetoAutores(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.bySlug(slug) });
    },
  });
};
