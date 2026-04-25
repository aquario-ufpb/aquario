"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser, useMyMemberships } from "@/lib/client/hooks/use-usuarios";
import { useEntidades } from "@/lib/client/hooks/use-entidades";
import { usuariosService } from "@/lib/client/api/usuarios";
import { disciplinaSemestreService } from "@/lib/client/api/disciplina-semestre";
import { queryKeys } from "@/lib/client/query-keys";
import { IS_DEV } from "@/lib/shared/config/env";
import { Fish, RotateCcw, Shield, Loader2, Building2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export function DevToolsPanel() {
  const [open, setOpen] = useState(false);
  const [selectedEntidadeId, setSelectedEntidadeId] = useState<string>("");
  const { token, isAuthenticated } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: entidades } = useEntidades();
  const { data: memberships } = useMyMemberships();
  const queryClient = useQueryClient();
  const isAdmin = user?.papelPlataforma === "MASTER_ADMIN";

  const currentMembership = memberships?.find(
    m => m.entidade.id === selectedEntidadeId && !m.endedAt
  );
  const isEntidadeAdmin = currentMembership?.papel === "ADMIN";
  const isMembro = !!currentMembership;

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

  const toggleEntidadeAdmin = useMutation({
    mutationFn: () => {
      if (!token || !selectedEntidadeId) {
        throw new Error("Missing data");
      }
      return usuariosService.toggleEntidadeAdmin(selectedEntidadeId, token);
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.currentMemberships });
      queryClient.invalidateQueries({ queryKey: queryKeys.entidades.all });
      const entidadeNome = entidades?.find(e => e.id === selectedEntidadeId)?.name ?? "entidade";
      const messages = {
        added: `Agora você é admin de ${entidadeNome}!`,
        promoted: `Agora você é admin de ${entidadeNome}!`,
        removed: `Você não é mais admin de ${entidadeNome}!`,
      };
      toast.success(messages[result.action]);
    },
    onError: () => {
      toast.error("Erro ao alterar papel na entidade.");
    },
  });

  const handleClearOnboarding = () => clearOnboarding.mutate();
  const handleToggleRole = () => toggleRole.mutate();
  const handleToggleEntidadeAdmin = () => toggleEntidadeAdmin.mutate();

  if (!IS_DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-16 z-[99999]">
      <div
        id="dev-tools-panel"
        inert={!open}
        className={`absolute bottom-12 left-0 w-72 origin-bottom-left rounded-lg border bg-background/95 shadow-xl backdrop-blur-sm transition-all duration-200 ease-out ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Fish className="h-4 w-4 text-aquario-primary" />
          <span className="text-sm font-semibold">Dev Tools</span>
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

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Admin de Entidade
            </p>
            <div className="relative">
              <select
                value={selectedEntidadeId}
                onChange={e => setSelectedEntidadeId(e.target.value)}
                disabled={!isAuthenticated}
                className="w-full appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                <option value="">Selecione uma entidade</option>
                {entidades
                  ?.slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {memberships?.some(
                        m => m.entidade.id === e.id && !m.endedAt && m.papel === "ADMIN"
                      )
                        ? " (Admin)"
                        : memberships?.some(m => m.entidade.id === e.id && !m.endedAt)
                          ? " (Membro)"
                          : ""}
                    </option>
                  ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {selectedEntidadeId && (
              <button
                type="button"
                onClick={handleToggleEntidadeAdmin}
                disabled={toggleEntidadeAdmin.isPending || !isAuthenticated}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                {toggleEntidadeAdmin.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
                {isMembro && isEntidadeAdmin ? "Deixar de ser admin" : "Tornar admin"}
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground">Faça login primeiro.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="dev-tools-panel"
        aria-label="Aquário Dev Tools"
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-aquario-primary text-white shadow-lg transition-all duration-200 hover:bg-aquario-primary/80 ${
          open
            ? "rotate-[20deg] ring-2 ring-aquario-primary/30 ring-offset-2 ring-offset-background"
            : ""
        }`}
      >
        <Fish className={`h-5 w-5 transition-transform duration-200 ${open ? "scale-110" : ""}`} />
      </button>
    </div>
  );
}
