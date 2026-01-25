"use client";

import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Building2 } from "lucide-react";
import Image from "next/image";
import type { UserMembership } from "@/lib/client/api/usuarios";

type EntidadesTabProps = {
  memberships: UserMembership[] | undefined;
  isLoading: boolean;
  showAllEntities: boolean;
  onShowAllEntitiesChange: (showAll: boolean) => void;
  title?: string;
  emptyMessage?: string;
};

export function EntidadesTab({
  memberships,
  isLoading,
  showAllEntities,
  onShowAllEntitiesChange,
  title = "Minhas Entidades",
  emptyMessage = "Você não é membro de nenhuma entidade ainda.",
}: EntidadesTabProps) {
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
        <SegmentedControl
          value={showAllEntities ? "all" : "active"}
          onValueChange={value => onShowAllEntitiesChange(value === "all")}
          options={[
            { value: "active", label: "Ativas" },
            { value: "all", label: "Todas" },
          ]}
        />
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
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(entitiesMap.entries()).map(([entidadeId, membroships]) => {
            const entidade = membroships[0].entidade;
            const activeMembership = membroships.find(m => !m.endedAt);
            const isActive = !!activeMembership;

            return (
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
    </div>
  );
}
