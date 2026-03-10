import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/client/api/api-client";
import type { CreateProjetoInput } from "@/lib/shared/validations/projeto";
import { toast } from "sonner";

export const useUploadProjetoImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/projeto-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      return data.url;
    },
  });
};

export const useCreateProjeto = () => {
  return useMutation({
    mutationFn: async (data: CreateProjetoInput) => {
      const response = await apiClient("/projetos", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar projeto");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto", {
        description: error.message,
      });
    },
  });
};