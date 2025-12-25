"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useUsuarios } from "@/lib/client/hooks/use-usuarios";
import { useAddEntidadeMember } from "@/lib/client/hooks/use-entidades";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";

type AddMemberDialogProps = {
  entidadeId: string;
  entidadeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMemberDialog({
  entidadeId,
  entidadeSlug,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [papel, setPapel] = useState<"ADMIN" | "MEMBRO">("MEMBRO");
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");

  const { data: users = [] } = useUsuarios();
  const addMemberMutation = useAddEntidadeMember();
  const queryClient = useQueryClient();

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const query = searchQuery.toLowerCase();
    return users
      .filter(
        u =>
          u.nome.toLowerCase().includes(query) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.centro?.nome && u.centro.nome.toLowerCase().includes(query)) ||
          (u.curso?.nome && u.curso.nome.toLowerCase().includes(query))
      )
      .slice(0, 10); // Limit to 10 results
  }, [searchQuery, users]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedUserId(null);
      setPapel("MEMBRO");
      setStartedAt("");
      setEndedAt("");
    }
  }, [open]);

  // Set default startedAt to today
  useEffect(() => {
    if (open && !startedAt) {
      const today = new Date().toISOString().split("T")[0];
      setStartedAt(today);
    }
  }, [open, startedAt]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        entidadeId,
        data: {
          usuarioId: selectedUserId,
          papel,
          startedAt: startedAt || undefined,
          endedAt: endedAt || null,
        },
      });

      toast.success("Membro adicionado", {
        description: "O membro foi adicionado à entidade com sucesso.",
      });

      // Invalidate entidade by slug to refetch with new member
      queryClient.invalidateQueries({
        queryKey: queryKeys.entidades.bySlug(entidadeSlug),
      });

      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar membro";
      toast.error("Erro ao adicionar membro", {
        description: errorMessage,
      });
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>
            Pesquise e selecione um usuário para adicionar como membro desta entidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Buscar Usuário</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Digite o nome, email, centro ou curso..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim() && filteredUsers.length > 0 && (
              <div className="border rounded-lg mt-2 max-h-64 overflow-y-auto">
                {filteredUsers.map(user => (
                  <Card
                    key={user.id}
                    className={`cursor-pointer hover:bg-accent/20 transition-colors ${
                      selectedUserId === user.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border/50">
                          {user.urlFotoPerfil ? (
                            <Image
                              src={user.urlFotoPerfil}
                              alt={user.nome}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {user.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.nome}</p>
                          {user.email && (
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {user.centro?.sigla} • {user.curso?.nome}
                          </p>
                        </div>
                        {selectedUserId === user.id && (
                          <UserPlus className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery.trim() && filteredUsers.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Nenhum usuário encontrado.</p>
            )}
          </div>

          {/* Selected User Display */}
          {selectedUser && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border/50">
                  {selectedUser.urlFotoPerfil ? (
                    <Image
                      src={selectedUser.urlFotoPerfil}
                      alt={selectedUser.nome}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-background flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {selectedUser.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedUser.nome}</p>
                  {selectedUser.email && (
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label htmlFor="papel">Papel</Label>
              <Select value={papel} onValueChange={(value: "ADMIN" | "MEMBRO") => setPapel(value)}>
                <SelectTrigger id="papel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBRO">Membro</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          {selectedUserId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="started-at">Data de Início</Label>
                <Input
                  id="started-at"
                  type="date"
                  value={startedAt}
                  onChange={e => setStartedAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ended-at">Data de Término (opcional)</Label>
                <Input
                  id="ended-at"
                  type="date"
                  value={endedAt}
                  onChange={e => setEndedAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Deixe em branco para membro ativo</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUserId || addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? "Adicionando..." : "Adicionar Membro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
