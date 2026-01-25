"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Building2 } from "lucide-react";
import type { UserMembership } from "@/lib/client/api/usuarios";

type TimelineTabProps = {
  memberships: UserMembership[] | undefined;
  isLoading: boolean;
  title?: string;
  emptyMessage?: string;
};

export function TimelineTab({
  memberships,
  isLoading,
  title = "Histórico de Membros",
  emptyMessage = "Nenhum histórico de membros encontrado.",
}: TimelineTabProps) {
  // Timeline data sorted by date (most recent first)
  const timelineData = memberships
    ? [...memberships].sort((a, b) => {
        const dateA = new Date(a.startedAt).getTime();
        const dateB = new Date(b.startedAt).getTime();
        return dateB - dateA;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between h-12">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="w-[120px]"></div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : timelineData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {timelineData.map(membership => {
              const startDate = new Date(membership.startedAt);
              const endDate = membership.endedAt ? new Date(membership.endedAt) : null;
              const isActive = !endDate;

              return (
                <div key={membership.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-3 top-2 w-2.5 h-2.5 rounded-full border-2 ${
                      isActive ? "bg-primary border-primary" : "bg-muted border-muted-foreground"
                    }`}
                  />

                  <Link
                    href={`/entidade/${membership.entidade.slug || membership.entidade.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        {membership.entidade.urlFoto ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={membership.entidade.urlFoto}
                              alt={membership.entidade.nome}
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
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{membership.entidade.nome}</span>
                            <Badge
                              variant={membership.papel === "ADMIN" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {membership.papel}
                            </Badge>
                            {isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Ativo
                              </Badge>
                            )}
                          </div>
                          {membership.cargo && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {membership.cargo.nome}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Início: {startDate.toLocaleDateString("pt-BR")}</span>
                            {endDate && <span>Fim: {endDate.toLocaleDateString("pt-BR")}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
