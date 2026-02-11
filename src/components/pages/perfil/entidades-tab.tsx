"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import type { UserMembership } from "@/lib/client/api/usuarios";
import { AddVinculoDialog } from "./add-vinculo-dialog";
import { EditVinculoDialog } from "./edit-vinculo-dialog";
import { useDeleteOwnMembership } from "@/lib/client/hooks/use-usuarios";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EntidadesTabProps = {
  memberships: UserMembership[] | undefined;
  isLoading: boolean;
  showAllEntities: boolean;
  onShowAllEntitiesChange: (showAll: boolean) => void;
  title?: string;
  emptyMessage?: string;
  isOwnProfile?: boolean;
};

function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function EntidadesTab({
  memberships,
  isLoading,
  showAllEntities,
  onShowAllEntitiesChange,
  title = "Minhas Entidades",
  emptyMessage = "Você não é membro de nenhuma entidade ainda.",
  isOwnProfile = false,
}: EntidadesTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<UserMembership | null>(null);
  const [deletingMembershipId, setDeletingMembershipId] = useState<string | null>(null);

  const deleteMutation = useDeleteOwnMembership();

  const handleDelete = async (membroId: string) => {
    try {
      await deleteMutation.mutateAsync(membroId);
      toast.success("Vínculo removido", {
        description: "O vínculo foi removido com sucesso.",
      });
      setDeletingMembershipId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover vínculo";
      toast.error("Erro ao remover vínculo", {
        description: errorMessage,
      });
    }
  };
  // Filter memberships based on toggle
  const filteredMemberships = showAllEntities
    ? memberships || []
    : (memberships || []).filter(m => !m.endedAt);

  // Group memberships by entidade
  const entitiesMap = new Map<string, UserMembership[]>();
  filteredMemberships.forEach(membership => {
    const entidadeId = membership.entidade.id;
    const existing = entitiesMap.get(entidadeId) || [];
    entitiesMap.set(entidadeId, [...existing, membership]);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between h-12">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {isOwnProfile && (
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Vínculo
            </Button>
          )}
          <SegmentedControl
            value={showAllEntities ? "all" : "active"}
            onValueChange={value => onShowAllEntitiesChange(value === "all")}
            options={[
              { value: "active", label: "Ativas" },
              { value: "all", label: "Todas" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : entitiesMap.size === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">{emptyMessage}</p>
          {isOwnProfile && (
            <Button onClick={() => setAddDialogOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Vínculo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(entitiesMap.entries()).map(([entidadeId, membroships]) => {
            const entidade = membroships[0].entidade;
            const activeMembership = membroships.find(m => !m.endedAt);
            const isActive = !!activeMembership;
            const membership = membroships[0]; // For actions, use the first membership

            return isOwnProfile ? (
              <div
                key={entidadeId}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                {entidade.urlFoto ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={entidade.urlFoto}
                      alt={entidade.nome}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <Link href={`/entidade/${entidade.slug || entidadeId}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{entidade.nome}</h4>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Ativo
                      </Badge>
                    )}
                    {activeMembership?.papel === "ADMIN" && (
                      <Badge variant="default" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entidade.centro.sigla} • {entidade.tipo}
                  </p>
                  {activeMembership?.cargo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeMembership.cargo.nome}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatMonthYear(membership.startedAt)}
                    {" - "}
                    {membership.endedAt ? formatMonthYear(membership.endedAt) : "Presente"}
                  </p>
                </Link>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMembership(membership)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingMembershipId(membership.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Link
                key={entidadeId}
                href={`/entidade/${entidade.slug || entidadeId}`}
                className="block"
              >
                <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  {entidade.urlFoto ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={entidade.urlFoto}
                        alt={entidade.nome}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{entidade.nome}</h4>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                      {activeMembership?.papel === "ADMIN" && (
                        <Badge variant="default" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {entidade.centro.sigla} • {entidade.tipo}
                    </p>
                    {activeMembership?.cargo && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activeMembership.cargo.nome}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isOwnProfile && (
        <>
          <AddVinculoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

          {editingMembership && (
            <EditVinculoDialog
              membership={editingMembership}
              open={!!editingMembership}
              onOpenChange={open => !open && setEditingMembership(null)}
            />
          )}

          <AlertDialog
            open={!!deletingMembershipId}
            onOpenChange={open => !open && setDeletingMembershipId(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover vínculo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover este vínculo? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletingMembershipId && handleDelete(deletingMembershipId)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Removendo..." : "Remover"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
