import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import {
  createProjeto,
  updateProjeto,
  updateProjetoAutores,
  uploadProjetoImage,
} from "@/lib/client/api/projetos";
import type {
  CreateProjetoInput,
  UpdateProjetoInput,
  UpdateProjetoAutoresInput,
} from "@/lib/shared/validations/projetos";
import { toast } from "sonner";

export const useUploadProjetoImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadProjetoImage(file),
  });
};

export const useCreateProjeto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjetoInput) => createProjeto(data),
    onSuccess: () => {
      toast.success("Projeto criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.all });
    },
    onError: error => {
      toast.error("Erro ao criar projeto", {
        description: error.message,
      });
    },
  });
};

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
