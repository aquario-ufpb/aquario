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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Building2 } from "lucide-react";
import Image from "next/image";
import { useEntidades, useEntidadeCargos } from "@/lib/client/hooks/use-entidades";
import {
  useCreateOwnMembership,
  useMyMemberships,
  useCurrentUser,
} from "@/lib/client/hooks/use-usuarios";
import { toast } from "sonner";

type AddVinculoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddVinculoDialog({ open, onOpenChange }: AddVinculoDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntidadeId, setSelectedEntidadeId] = useState<string | null>(null);
  const [papel, setPapel] = useState<"ADMIN" | "MEMBRO">("MEMBRO");
  const [cargoId, setCargoId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");

  const { data: entidades = [] } = useEntidades();
  const { data: myMemberships = [] } = useMyMemberships();
  const { data: cargos = [] } = useEntidadeCargos(selectedEntidadeId || "");
  const { data: currentUser } = useCurrentUser();
  const createMutation = useCreateOwnMembership();

  // Check if user is MASTER_ADMIN
  const isMasterAdmin = currentUser?.papelPlataforma === "MASTER_ADMIN";

  // Filter entidades by search query
  const filteredEntidades = entidades.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is already a member
  const isAlreadyMember = (entidadeId: string) => {
    return myMemberships.some(m => m.entidade.id === entidadeId && !m.endedAt);
  };

  // Set default startedAt to today when opening
  useEffect(() => {
    if (open && !startedAt) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      setStartedAt(`${year}-${month}-${day}`);
    }
  }, [open, startedAt]);

  const handleSubmit = async () => {
    if (!selectedEntidadeId) {
      toast.error("Selecione uma entidade");
      return;
    }

    // Validate dates
    if (startedAt && endedAt && new Date(startedAt) > new Date(endedAt)) {
      toast.error("Data de início não pode ser posterior à data de término");
      return;
    }

    try {
      await createMutation.mutateAsync({
        entidadeId: selectedEntidadeId,
        papel,
        cargoId,
        startedAt: startedAt || undefined,
        endedAt: endedAt || undefined,
      });

      toast.success("Vínculo adicionado", {
        description: "O vínculo foi adicionado com sucesso.",
      });

      // Reset form
      setSelectedEntidadeId(null);
      setSearchQuery("");
      setPapel("MEMBRO");
      setCargoId(null);
      setStartedAt("");
      setEndedAt("");
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar vínculo";
      toast.error("Erro ao adicionar vínculo", {
        description: errorMessage,
      });
    }
  };

  const selectedEntidade = entidades.find(e => e.id === selectedEntidadeId);
  const isAlreadyActiveMember = selectedEntidadeId ? isAlreadyMember(selectedEntidadeId) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Vínculo</DialogTitle>
          <DialogDescription>
            Adicione uma entidade da qual você participa ou participou.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="entidade-search">Buscar Entidade</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="entidade-search"
                placeholder="Digite o nome da entidade..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery.trim() && filteredEntidades.length > 0 && (
              <div className="border rounded-lg mt-2 max-h-64 overflow-y-auto">
                {filteredEntidades.map(entidade => {
                  const alreadyMember = isAlreadyMember(entidade.id);
                  return (
                    <Card
                      key={entidade.id}
                      className={`cursor-pointer hover:bg-accent/20 transition-colors ${
                        selectedEntidadeId === entidade.id ? "bg-accent" : ""
                      } ${alreadyMember ? "border-primary/50" : ""}`}
                      onClick={() => setSelectedEntidadeId(entidade.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {entidade.imagePath ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border/50">
                              <Image
                                src={entidade.imagePath}
                                alt={entidade.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{entidade.name}</p>
                              {alreadyMember && (
                                <Badge variant="outline" className="text-xs">
                                  Já é membro
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {entidade.centro?.sigla} • {entidade.tipo}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {searchQuery.trim() && filteredEntidades.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Nenhuma entidade encontrada.</p>
            )}
          </div>

          {selectedEntidade && !isAlreadyActiveMember && (
            <div className="space-y-4 pt-2 border-t">
              {isMasterAdmin && (
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
              )}

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
            </div>
          )}

          {isAlreadyActiveMember && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Você já possui um vínculo ativo com esta entidade.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEntidadeId || isAlreadyActiveMember || createMutation.isPending}
          >
            {createMutation.isPending ? "Adicionando..." : "Adicionar Vínculo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
