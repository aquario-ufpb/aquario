import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { queryKeys } from "@/lib/client/query-keys";
import type { CreateProjetoInput } from "@/lib/shared/validations/projeto";
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
