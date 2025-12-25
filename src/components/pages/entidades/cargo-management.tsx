"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

type SortableCargoItemProps = {
  cargo: {
    id: string;
    nome: string;
    descricao?: string | null;
    ordem: number;
  };
  isEditing: boolean;
  editingNome: string;
  editingDescricao: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onNomeChange: (value: string) => void;
  onDescricaoChange: (value: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
};

function SortableCargoItem({
  cargo,
  isEditing,
  editingNome,
  editingDescricao,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onNomeChange,
  onDescricaoChange,
  isUpdating,
  isDeleting,
}: SortableCargoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cargo.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded bg-background"
    >
      {!isEditing && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {isEditing ? (
        <div className="flex-1 space-y-2">
          <Input
            value={editingNome}
            onChange={e => onNomeChange(e.target.value)}
            placeholder="Nome do cargo"
          />
          <Textarea
            value={editingDescricao}
            onChange={e => onDescricaoChange(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} disabled={!editingNome.trim() || isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar"}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <p className="font-medium text-sm">{cargo.nome}</p>
            {cargo.descricao && <p className="text-xs text-muted-foreground">{cargo.descricao}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}

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

  // Sort cargos by ordem
  const sortedCargos = useMemo(() => {
    return [...cargos].sort((a, b) => a.ordem - b.ordem);
  }, [cargos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          ordem: sortedCargos.length,
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedCargos.findIndex(cargo => cargo.id === active.id);
    const newIndex = sortedCargos.findIndex(cargo => cargo.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newCargos = arrayMove(sortedCargos, oldIndex, newIndex);

    // Update ordem for all affected cargos
    try {
      const updatePromises = newCargos.map((cargo, index) => {
        if (cargo.ordem !== index) {
          return updateCargoMutation.mutateAsync({
            entidadeId,
            cargoId: cargo.id,
            data: {
              ordem: index,
            },
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      refetchCargos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao reordenar cargos";
      toast.error("Erro ao reordenar cargos", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/30 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-semibold">Cargos ({sortedCargos.length})</Label>
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

      {sortedCargos.length > 0 && (
        <div className="space-y-2">
          <Label>Cargos Existentes (arraste para reordenar)</Label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedCargos.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedCargos.map(cargo => (
                  <SortableCargoItem
                    key={cargo.id}
                    cargo={cargo}
                    isEditing={editingCargoId === cargo.id}
                    editingNome={editingCargoNome}
                    editingDescricao={editingCargoDescricao}
                    onEdit={() => {
                      setEditingCargoId(cargo.id);
                      setEditingCargoNome(cargo.nome);
                      setEditingCargoDescricao(cargo.descricao || "");
                    }}
                    onSave={() => {
                      handleUpdateCargo(cargo.id, editingCargoNome, editingCargoDescricao);
                    }}
                    onCancel={() => {
                      setEditingCargoId(null);
                      setEditingCargoNome("");
                      setEditingCargoDescricao("");
                    }}
                    onDelete={() => handleDeleteCargo(cargo.id)}
                    onNomeChange={setEditingCargoNome}
                    onDescricaoChange={setEditingCargoDescricao}
                    isUpdating={updateCargoMutation.isPending}
                    isDeleting={deleteCargoMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
