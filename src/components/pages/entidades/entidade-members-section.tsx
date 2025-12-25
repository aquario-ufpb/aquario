"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users } from "lucide-react";
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
    <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-12">
      <div className="border-t border-border/30 pt-8">
        {/* Header with filter toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Membros</h2>
            <Badge variant="secondary" className="text-xs">
              {mergedMembers.length}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented control for toggle */}
            <div className="inline-flex items-center rounded-lg border border-border/50 bg-muted/30 p-1">
              <button
                onClick={() => setShowOldMembers(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !showOldMembers
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setShowOldMembers(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showOldMembers
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos
              </button>
            </div>

            {canAddMembers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddMemberDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            )}
          </div>
        </div>

        {/* Members Grid */}
        {mergedMembers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {showOldMembers
                ? "Esta entidade ainda não possui membros."
                : "Esta entidade ainda não possui membros ativos."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mergedMembers.map((merged, index) => (
              <div
                key={`${merged.usuario.id}-${index}`}
                className={`group hover:scale-105 transition-transform duration-200 ${
                  !merged.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border/30 group-hover:border-border/60 transition-colors">
                      {merged.usuario.urlFotoPerfil ? (
                        <Image
                          src={merged.usuario.urlFotoPerfil}
                          alt={merged.usuario.nome}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-xl font-semibold">
                            {merged.usuario.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Role indicator */}
                    {merged.currentPapel === "ADMIN" && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary-foreground">A</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="w-full">
                    <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                      {merged.usuario.nome}
                    </h3>

                    {/* Course */}
                    {merged.usuario.curso?.nome && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {merged.usuario.curso.nome}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {!merged.isActive && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Antigo
                      </Badge>
                    )}
                    {merged.membershipCount > 1 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {merged.membershipCount}x
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
