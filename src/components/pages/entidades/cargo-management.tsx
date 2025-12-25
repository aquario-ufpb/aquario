"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import {
  useEntidadeCargos,
  useCreateCargo,
  useUpdateCargo,
  useDeleteCargo,
} from "@/lib/client/hooks/use-entidades";
import { toast } from "sonner";

type CargoManagementProps = {
  entidadeId: string;
};

export function CargoManagement({ entidadeId }: CargoManagementProps) {
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [editingCargoNome, setEditingCargoNome] = useState("");
  const [editingCargoDescricao, setEditingCargoDescricao] = useState("");
  const [newCargoNome, setNewCargoNome] = useState("");
  const [newCargoDescricao, setNewCargoDescricao] = useState("");

  const { data: cargos = [], refetch: refetchCargos } = useEntidadeCargos(entidadeId);
  const createCargoMutation = useCreateCargo();
  const updateCargoMutation = useUpdateCargo();
  const deleteCargoMutation = useDeleteCargo();

  const handleCreateCargo = async () => {
    if (!newCargoNome.trim()) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    try {
      await createCargoMutation.mutateAsync({
        entidadeId,
        data: {
          nome: newCargoNome.trim(),
          descricao: newCargoDescricao.trim() || null,
          ordem: cargos.length,
        },
      });

      toast.success("Cargo criado", {
        description: "O cargo foi criado com sucesso.",
      });

      setNewCargoNome("");
      setNewCargoDescricao("");
      refetchCargos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar cargo";
      toast.error("Erro ao criar cargo", {
        description: errorMessage,
      });
    }
  };

  const handleUpdateCargo = async (cargoIdToUpdate: string, nome: string, descricao: string) => {
    try {
      await updateCargoMutation.mutateAsync({
        entidadeId,
        cargoId: cargoIdToUpdate,
        data: {
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        },
      });

      toast.success("Cargo atualizado", {
        description: "O cargo foi atualizado com sucesso.",
      });

      setEditingCargoId(null);
      refetchCargos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar cargo";
      toast.error("Erro ao atualizar cargo", {
        description: errorMessage,
      });
    }
  };

  const handleDeleteCargo = async (cargoIdToDelete: string) => {
    if (!confirm("Tem certeza que deseja deletar este cargo?")) {
      return;
    }

    try {
      await deleteCargoMutation.mutateAsync({
        entidadeId,
        cargoId: cargoIdToDelete,
      });

      toast.success("Cargo deletado", {
        description: "O cargo foi deletado com sucesso.",
      });

      refetchCargos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar cargo";
      toast.error("Erro ao deletar cargo", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-semibold">Cargos ({cargos.length})</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-cargo-nome">Novo Cargo</Label>
        <Input
          id="new-cargo-nome"
          placeholder="Nome do cargo"
          value={newCargoNome}
          onChange={e => setNewCargoNome(e.target.value)}
        />
        <Textarea
          placeholder="Descrição (opcional)"
          value={newCargoDescricao}
          onChange={e => setNewCargoDescricao(e.target.value)}
          rows={2}
        />
        <Button
          size="sm"
          onClick={handleCreateCargo}
          disabled={!newCargoNome.trim() || createCargoMutation.isPending}
        >
          {createCargoMutation.isPending ? "Criando..." : "Criar Cargo"}
        </Button>
      </div>

      {cargos.length > 0 && (
        <div className="space-y-2">
          <Label>Cargos Existentes</Label>
          <div className="space-y-2">
            {cargos.map(cargo => (
              <div
                key={cargo.id}
                className="flex items-center gap-2 p-2 border rounded bg-background"
              >
                {editingCargoId === cargo.id ? (
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editingCargoNome}
                      onChange={e => setEditingCargoNome(e.target.value)}
                      placeholder="Nome do cargo"
                    />
                    <Textarea
                      value={editingCargoDescricao}
                      onChange={e => setEditingCargoDescricao(e.target.value)}
                      placeholder="Descrição (opcional)"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleUpdateCargo(cargo.id, editingCargoNome, editingCargoDescricao);
                        }}
                        disabled={!editingCargoNome.trim() || updateCargoMutation.isPending}
                      >
                        {updateCargoMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCargoId(null);
                          setEditingCargoNome("");
                          setEditingCargoDescricao("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cargo.nome}</p>
                      {cargo.descricao && (
                        <p className="text-xs text-muted-foreground">{cargo.descricao}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCargoId(cargo.id);
                        setEditingCargoNome(cargo.nome);
                        setEditingCargoDescricao(cargo.descricao || "");
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCargo(cargo.id)}
                      disabled={deleteCargoMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
