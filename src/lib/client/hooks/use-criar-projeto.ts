import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { queryKeys } from "@/lib/client/query-keys";
import type {
  CreateProjetoInput,
  UpdateProjetoInput,
  UpdateProjetoAutoresInput,
} from "@/lib/shared/validations/projetos";
import { toast } from "sonner";

export const useUploadProjetoImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient("/upload/projeto-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        await throwApiError(response);
      }

      const data = await response.json();
      return data.url;
    },
  });
};

export const useCreateProjeto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjetoInput) => {
      const response = await apiClient("/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        await throwApiError(response);
      }

      return response.json();
    },
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
    mutationFn: async (data: UpdateProjetoInput) => {
      const response = await apiClient(`/projetos/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        await throwApiError(response);
      }
      return response.json();
    },
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
    mutationFn: async (data: UpdateProjetoAutoresInput) => {
      const response = await apiClient(`/projetos/${slug}/autores`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        await throwApiError(response);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projetos.bySlug(slug) });
    },
  });
};
