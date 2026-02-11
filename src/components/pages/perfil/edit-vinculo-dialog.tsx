"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntidadeCargos } from "@/lib/client/hooks/use-entidades";
import { useUpdateOwnMembership, useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { toast } from "sonner";
import type { UserMembership } from "@/lib/client/api/usuarios";

type EditVinculoDialogProps = {
  membership: UserMembership;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditVinculoDialog({ membership, open, onOpenChange }: EditVinculoDialogProps) {
  const [papel, setPapel] = useState<"ADMIN" | "MEMBRO">(membership.papel);
  const [cargoId, setCargoId] = useState<string | null>(membership.cargo?.id || null);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");

  const { data: cargos = [] } = useEntidadeCargos(membership.entidade.id);
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateOwnMembership();

  // Check if user is MASTER_ADMIN
  const isMasterAdmin = currentUser?.papelPlataforma === "MASTER_ADMIN";

  // Initialize dates when dialog opens
  useEffect(() => {
    if (open) {
      setPapel(membership.papel);
      setCargoId(membership.cargo?.id || null);
      setStartedAt(new Date(membership.startedAt).toISOString().split("T")[0]);
      setEndedAt(
        membership.endedAt ? new Date(membership.endedAt).toISOString().split("T")[0] : ""
      );
    }
  }, [open, membership]);

  const handleSubmit = async () => {
    // Validate dates
    if (startedAt && endedAt && new Date(startedAt) > new Date(endedAt)) {
      toast.error("Data de início não pode ser posterior à data de término");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        membroId: membership.id,
        data: {
          papel,
          cargoId,
          startedAt: startedAt || undefined,
          endedAt: endedAt || null,
        },
      });

      toast.success("Vínculo atualizado", {
        description: "O vínculo foi atualizado com sucesso.",
      });

      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar vínculo";
      toast.error("Erro ao atualizar vínculo", {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Vínculo</DialogTitle>
          <DialogDescription>
            Edite as informações do seu vínculo com {membership.entidade.nome}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isMasterAdmin ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="papel">Papel</Label>
                <Select
                  value={papel}
                  onValueChange={(value: "ADMIN" | "MEMBRO") => setPapel(value)}
                >
                  <SelectTrigger id="papel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBRO">Membro</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo (opcional)</Label>
                {cargos.length > 0 ? (
                  <Select
                    value={cargoId || "__none__"}
                    onValueChange={value => {
                      setCargoId(value === "__none__" ? null : value);
                    }}
                  >
                    <SelectTrigger id="cargo">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum cargo</SelectItem>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo.id} value={cargo.id}>
                          {cargo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cargo cadastrado para esta entidade.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Seu papel: <strong>{papel === "ADMIN" ? "Administrador" : "Membro"}</strong>.
                  Apenas administradores da plataforma podem alterar o papel.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo (opcional)</Label>
                {cargos.length > 0 ? (
                  <Select
                    value={cargoId || "__none__"}
                    onValueChange={value => {
                      setCargoId(value === "__none__" ? null : value);
                    }}
                  >
                    <SelectTrigger id="cargo">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum cargo</SelectItem>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo.id} value={cargo.id}>
                          {cargo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cargo cadastrado para esta entidade.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="started-at">Data de Início</Label>
              <Input
                id="started-at"
                type="date"
                value={startedAt}
                onChange={e => setStartedAt(e.target.value)}
                max={endedAt || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ended-at">Data de Término (opcional)</Label>
              <Input
                id="ended-at"
                type="date"
                value={endedAt}
                onChange={e => setEndedAt(e.target.value)}
                min={startedAt || undefined}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se o vínculo ainda está ativo
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
