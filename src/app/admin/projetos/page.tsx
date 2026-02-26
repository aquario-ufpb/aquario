"use client";

import { CriarProjetoForm } from "@/components/pages/admin/criar-projeto-form";
import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";

export default function AdminProjetosPage() {
  const { isLoading } = useRequireAuth({ requireRole: "MASTER_ADMIN" });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Criar Projeto</h1>
        <p className="text-muted-foreground mt-2">
          Crie um novo projeto com imagem, título e descrição
        </p>
      </div>
      <CriarProjetoForm />
    </div>
  );
}