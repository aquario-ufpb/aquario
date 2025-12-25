"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import Image from "next/image";
import type { Membro, Cargo } from "@/lib/shared/types/membro.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpdateEntidadeMember } from "@/lib/client/hooks/use-entidades";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import type { Entidade } from "@/lib/shared/types";

type MembersTableProps = {
  members: Membro[];
  cargos: Cargo[];
  entidade: Entidade;
};

export function MembersTable({ members, cargos, entidade }: MembersTableProps) {
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberPapel, setEditingMemberPapel] = useState<"ADMIN" | "MEMBRO">("MEMBRO");
  const [editingMemberCargoId, setEditingMemberCargoId] = useState<string | null>(null);
  const [editingMemberStartedAt, setEditingMemberStartedAt] = useState("");
  const [editingMemberEndedAt, setEditingMemberEndedAt] = useState("");

  const updateMemberMutation = useUpdateEntidadeMember();
  const queryClient = useQueryClient();

  const handleUpdateMember = async (membroId: string) => {
    try {
      await updateMemberMutation.mutateAsync({
        entidadeId: entidade.id,
        membroId,
        data: {
          papel: editingMemberPapel,
          cargoId: editingMemberCargoId || null,
          startedAt: editingMemberStartedAt || undefined,
          endedAt: editingMemberEndedAt || null,
        },
      });

      toast.success("Membro atualizado", {
        description: "O membro foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.entidades.bySlug(entidade.slug),
      });

      setEditingMemberId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar membro";
      toast.error("Erro ao atualizar membro", {
        description: errorMessage,
      });
    }
  };

  const startEditingMember = (membro: Membro) => {
    setEditingMemberId(membro.id);
    setEditingMemberPapel(membro.papel);
    setEditingMemberCargoId(membro.cargo?.id || null);
    setEditingMemberStartedAt(
      membro.startedAt ? new Date(membro.startedAt).toISOString().split("T")[0] : ""
    );
    setEditingMemberEndedAt(
      membro.endedAt ? new Date(membro.endedAt).toISOString().split("T")[0] : ""
    );
  };

  return (
    <ScrollArea className="max-h-[400px] border rounded-lg">
      <div className="min-w-full">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Usuário</th>
              <th className="text-left p-3 text-sm font-medium">Cargo</th>
              <th className="text-left p-3 text-sm font-medium">Papel</th>
              <th className="text-left p-3 text-sm font-medium">Início</th>
              <th className="text-left p-3 text-sm font-medium">Término</th>
              <th className="text-right p-3 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Nenhum membro encontrado.
                </td>
              </tr>
            ) : (
              members.map(membro => {
                const isEditing = editingMemberId === membro.id;
                return (
                  <tr
                    key={membro.id}
                    className={`border-b hover:bg-muted/30 ${membro.endedAt ? "opacity-60" : ""}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border/50">
                          {membro.usuario.urlFotoPerfil ? (
                            <Image
                              src={membro.usuario.urlFotoPerfil}
                              alt={membro.usuario.nome}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-semibold">
                                {membro.usuario.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{membro.usuario.nome}</p>
                          {membro.usuario.curso?.nome && (
                            <p className="text-xs text-muted-foreground">
                              {membro.usuario.curso.nome}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Select
                          value={editingMemberCargoId || "__none__"}
                          onValueChange={value =>
                            setEditingMemberCargoId(value === "__none__" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {cargos.map(cargo => (
                              <SelectItem key={cargo.id} value={cargo.id}>
                                {cargo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
                          {membro.cargo ? (
                            <Badge variant="secondary">{membro.cargo.nome}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Select
                          value={editingMemberPapel}
                          onValueChange={(value: "ADMIN" | "MEMBRO") =>
                            setEditingMemberPapel(value)
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBRO">Membro</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={membro.papel === "ADMIN" ? "default" : "outline"}>
                          {membro.papel}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editingMemberStartedAt}
                          onChange={e => setEditingMemberStartedAt(e.target.value)}
                          className="w-36 h-8"
                        />
                      ) : (
                        <span className="text-sm">
                          {membro.startedAt
                            ? new Date(membro.startedAt).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editingMemberEndedAt}
                          onChange={e => setEditingMemberEndedAt(e.target.value)}
                          className="w-36 h-8"
                          placeholder="Ativo"
                        />
                      ) : (
                        <span className="text-sm">
                          {membro.endedAt
                            ? new Date(membro.endedAt).toLocaleDateString("pt-BR")
                            : "Ativo"}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateMember(membro.id)}
                              disabled={updateMemberMutation.isPending}
                            >
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMemberId(null)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingMember(membro)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
