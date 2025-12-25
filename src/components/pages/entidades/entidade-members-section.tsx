"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, History } from "lucide-react";
import type { Entidade } from "@/lib/shared/types";
import { type Membro, isUserAdminOfEntidade } from "@/lib/shared/types/membro.types";
import { AddMemberDialog } from "./add-member-dialog";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import Image from "next/image";

type EntidadeMembersSectionProps = {
  entidade: Entidade;
};

type MergedMember = {
  usuario: Membro["usuario"];
  papel: Membro["papel"];
  membershipCount: number;
  earliestStart: string | undefined;
  latestEnd: string | null | undefined;
  isActive: boolean;
  currentPapel: Membro["papel"];
};

export function EntidadeMembersSection({ entidade }: EntidadeMembersSectionProps) {
  const { data: user } = useCurrentUser();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [showOldMembers, setShowOldMembers] = useState(false);

  // Get all members or just active ones based on toggle
  const filteredMembers = useMemo(() => {
    const allMembers: Membro[] = entidade.membros || [];
    if (showOldMembers) {
      return allMembers;
    }
    return allMembers.filter(m => !m.endedAt);
  }, [entidade.membros, showOldMembers]);

  // Merge members by usuario.id
  const mergedMembers = useMemo(() => {
    const memberMap = new Map<string, MergedMember>();

    filteredMembers.forEach(membro => {
      const userId = membro.usuario.id;
      const existing = memberMap.get(userId);

      if (existing) {
        // Update with latest information
        existing.membershipCount += 1;

        // Update earliest start date
        if (membro.startedAt) {
          if (
            !existing.earliestStart ||
            new Date(membro.startedAt) < new Date(existing.earliestStart)
          ) {
            existing.earliestStart = membro.startedAt;
          }
        }

        // Update latest end date
        if (membro.endedAt) {
          if (!existing.latestEnd || new Date(membro.endedAt) > new Date(existing.latestEnd)) {
            existing.latestEnd = membro.endedAt;
          }
        } else {
          // If this membership is active, mark as active
          existing.isActive = true;
          existing.currentPapel = membro.papel;
        }

        // Prefer ADMIN role if any membership was ADMIN
        if (membro.papel === "ADMIN") {
          existing.currentPapel = "ADMIN";
        }
      } else {
        // First time seeing this user
        memberMap.set(userId, {
          usuario: membro.usuario,
          papel: membro.papel,
          membershipCount: 1,
          earliestStart: membro.startedAt,
          latestEnd: membro.endedAt,
          isActive: !membro.endedAt,
          currentPapel: membro.papel,
        });
      }
    });

    return Array.from(memberMap.values());
  }, [filteredMembers]);

  // Check if user can add members (MASTER_ADMIN or entidade ADMIN)
  const canAddMembers =
    user &&
    (user.papelPlataforma === "MASTER_ADMIN" || isUserAdminOfEntidade(user.id, entidade.membros));

  return (
    <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-8">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-2xl md:text-3xl font-semibold">Membros</CardTitle>
              </div>
              {canAddMembers && (
                <Button
                  variant="default"
                  onClick={() => setIsAddMemberDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Adicionar Membro
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-old-members"
                checked={showOldMembers}
                onCheckedChange={checked => setShowOldMembers(checked === true)}
              />
              <Label
                htmlFor="show-old-members"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                Incluir membros antigos
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mergedMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {showOldMembers
                  ? "Esta entidade ainda não possui membros."
                  : "Esta entidade ainda não possui membros ativos."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mergedMembers.map((merged, index) => (
                <Card
                  key={`${merged.usuario.id}-${index}`}
                  className={`hover:bg-accent/20 transition-all duration-200 border-border/50 ${
                    !merged.isActive ? "opacity-75" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-3">
                      {/* Avatar */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border/50">
                        {merged.usuario.urlFotoPerfil ? (
                          <Image
                            src={merged.usuario.urlFotoPerfil}
                            alt={merged.usuario.nome}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-2xl font-semibold">
                              {merged.usuario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-lg">{merged.usuario.nome}</h3>

                      {/* Role Badge */}
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={merged.currentPapel === "ADMIN" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {merged.currentPapel === "ADMIN" ? "Administrador" : "Membro"}
                        </Badge>
                        {!merged.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Antigo
                          </Badge>
                        )}
                      </div>

                      {/* Membership Count */}
                      {merged.membershipCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Membro {merged.membershipCount}x
                        </Badge>
                      )}

                      {/* Course */}
                      {merged.usuario.curso?.nome && (
                        <p className="text-xs text-muted-foreground">{merged.usuario.curso.nome}</p>
                      )}

                      {/* Dates */}
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {merged.earliestStart && (
                          <p>
                            {merged.membershipCount > 1 ? "Primeira vez: " : "Desde: "}
                            {new Date(merged.earliestStart).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {merged.latestEnd && (
                          <p>Até: {new Date(merged.latestEnd).toLocaleDateString("pt-BR")}</p>
                        )}
                        {merged.isActive && merged.earliestStart && (
                          <p className="text-green-600 dark:text-green-400 font-medium">Ativo</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      {canAddMembers && entidade.id && (
        <AddMemberDialog
          entidadeId={entidade.id}
          entidadeSlug={entidade.slug}
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
        />
      )}
    </div>
  );
}
