"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { usuariosService } from "@/lib/client/api/usuarios";
import { disciplinaSemestreService } from "@/lib/client/api/disciplina-semestre";
import { queryKeys } from "@/lib/client/query-keys";
import { IS_DEV } from "@/lib/shared/config/env";
import { Fish, X, RotateCcw, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const isAdmin = user?.papelPlataforma === "MASTER_ADMIN";

  const clearOnboarding = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No token");
      }
      await Promise.all([
        usuariosService.clearOnboardingMetadata(token),
        usuariosService.updateMyDisciplinasConcluidas(token, []),
        usuariosService.updatePeriodoAtual(null, token),
        disciplinaSemestreService.saveForActiveSemestre({ disciplinas: [] }, token).catch(() => {}),
      ]);
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.usuarios.onboarding, {});
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.onboarding });
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
      queryClient.invalidateQueries({ queryKey: queryKeys.disciplinasConcluidas.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.disciplinasSemestre.ativo });
      toast.success("Onboarding resetado!");
    },
    onError: () => {
      toast.error("Erro ao resetar onboarding.");
    },
  });

  const toggleRole = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("No token");
      }
      const targetRole = isAdmin ? "USER" : "MASTER_ADMIN";
      await usuariosService.toggleRole(targetRole, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.current });
      toast.success(isAdmin ? "Agora você é USER!" : "Agora você é MASTER_ADMIN!");
    },
    onError: () => {
      toast.error("Erro ao alterar papel.");
    },
  });

  const handleClearOnboarding = () => clearOnboarding.mutate();
  const handleToggleRole = () => toggleRole.mutate();

  if (!IS_DEV) {
    return null;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-16 z-[99999] flex h-10 w-10 items-center justify-center rounded-full bg-aquario-primary text-white shadow-lg transition-colors hover:bg-aquario-primary/80"
        title="Aquário Dev Tools"
      >
        <Fish className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 left-14 z-[99999] w-72 rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Fish className="h-4 w-4 text-aquario-primary" />
          <span className="text-sm font-semibold">Dev Tools</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-0.5 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Onboarding
          </p>
          <button
            onClick={handleClearOnboarding}
            disabled={clearOnboarding.isPending || !isAuthenticated}
            className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            {clearOnboarding.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Resetar onboarding
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Permissões
          </p>
          <button
            onClick={handleToggleRole}
            disabled={toggleRole.isPending || !isAuthenticated}
            className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            {toggleRole.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Shield className="h-3.5 w-3.5" />
            )}
            {isAdmin ? "Tornar USER" : "Tornar MASTER_ADMIN"}
          </button>
        </div>

        {!isAuthenticated && <p className="text-xs text-muted-foreground">Faça login primeiro.</p>}
      </div>
    </div>
  );
}
