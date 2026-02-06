"use client";

import { createContext, useContext, useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useSearchUsers } from "@/lib/client/hooks/use-usuarios";
import { useAddEntidadeMember, useEntidadeCargos } from "@/lib/client/hooks/use-entidades";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { Entidade } from "@/lib/shared/types";
import type { Membro } from "@/lib/shared/types/membro.types";

type AddMemberFormContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  entidade: Entidade;
};

const AddMemberFormContext = createContext<AddMemberFormContextType | null>(null);

function useAddMemberFormContext() {
  const context = useContext(AddMemberFormContext);
  if (!context) {
    throw new Error("AddMemberForm components must be used within AddMemberForm");
  }
  return context;
}

type AddMemberFormProps = {
  entidade: Entidade;
  children: React.ReactNode;
};

export function AddMemberForm({ entidade, children }: AddMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AddMemberFormContext.Provider value={{ isOpen, setIsOpen, entidade }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Collapsible>
    </AddMemberFormContext.Provider>
  );
}

function AddMemberFormTrigger() {
  const { setIsOpen } = useAddMemberFormContext();

  return (
    <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
      <UserPlus className="w-4 h-4 mr-2" />
      Adicionar Membro
    </Button>
  );
}

function AddMemberFormContent({ onMemberAdded }: { onMemberAdded?: () => void }) {
  const { isOpen, setIsOpen, entidade } = useAddMemberFormContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [papel, setPapel] = useState<"ADMIN" | "MEMBRO">("MEMBRO");
  const [cargoId, setCargoId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");

  const { data: searchResponse } = useSearchUsers(searchQuery, 10);
  const { data: cargos = [] } = useEntidadeCargos(entidade.id);
  const addMemberMutation = useAddEntidadeMember();
  const queryClient = useQueryClient();

  const members = entidade.membros || [];

  // Extract users array from the response object
  const users = searchResponse?.users || [];

  // Check if user is already a member
  const isUserMember = (userId: string): Membro | undefined => {
    return members.find(m => m.usuario.id === userId && !m.endedAt);
  };

  // Set default startedAt to today when opening
  useEffect(() => {
    if (isOpen && !startedAt) {
      const today = new Date().toISOString().split("T")[0];
      setStartedAt(today);
    }
  }, [isOpen, startedAt]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    // Validate dates
    if (startedAt && endedAt && new Date(startedAt) > new Date(endedAt)) {
      toast.error("Data de início não pode ser posterior à data de término");
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        entidadeId: entidade.id,
        data: {
          usuarioId: selectedUserId,
          papel,
          cargoId: cargoId || null,
          startedAt: startedAt || undefined,
          endedAt: endedAt || null,
        },
      });

      toast.success("Membro adicionado", {
        description: "O membro foi adicionado à entidade com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.entidades.bySlug(entidade.slug),
      });

      // Reset form
      setSelectedUserId(null);
      setSearchQuery("");
      setPapel("MEMBRO");
      setCargoId(null);
      setStartedAt("");
      setEndedAt("");
      setIsOpen(false);
      onMemberAdded?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar membro";
      toast.error("Erro ao adicionar membro", {
        description: errorMessage,
      });
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedUserMembership = selectedUserId ? isUserMember(selectedUserId) : undefined;

  return (
    <CollapsibleContent className="w-full mt-2 mb-2">
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30 w-full">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Adicionar Novo Membro</Label>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

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

          {searchQuery.trim() && users.length > 0 && (
            <div className="border rounded-lg mt-2 max-h-48 overflow-y-auto">
              {users.map(user => {
                const membership = isUserMember(user.id);
                return (
                  <Card
                    key={user.id}
                    className={`cursor-pointer hover:bg-accent/20 transition-colors ${
                      selectedUserId === user.id ? "bg-accent" : ""
                    } ${membership ? "border-primary/50" : ""}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <CardContent className="p-3">
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{user.nome}</p>
                            {membership && (
                              <Badge variant="outline" className="text-xs">
                                Já é membro
                              </Badge>
                            )}
                          </div>
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
                );
              })}
            </div>
          )}

          {searchQuery.trim() && users.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">Nenhum usuário encontrado.</p>
          )}
        </div>

        {selectedUser && !selectedUserMembership && (
          <div className="space-y-4 pt-2 border-t">
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
                <Select
                  value={cargoId || "__none__"}
                  onValueChange={value => setCargoId(value === "__none__" ? null : value)}
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
              </div>
            </div>

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
              </div>
            </div>

            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending}
              className="w-full"
            >
              {addMemberMutation.isPending ? "Adicionando..." : "Adicionar Membro"}
            </Button>
          </div>
        )}

        {selectedUserMembership && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Este usuário já é membro ativo desta entidade.
            </p>
          </div>
        )}
      </div>
    </CollapsibleContent>
  );
}

AddMemberForm.Trigger = AddMemberFormTrigger;
AddMemberForm.Content = AddMemberFormContent;
