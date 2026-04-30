"use client";

import { useState, useMemo, use, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntidadeBySlug, useEntidades } from "@/lib/client/hooks";
import { useProjetosByEntidade, useEntidadeProjetoCounts } from "@/lib/client/hooks/use-projetos";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/client/query-keys";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { EditarEntidadeDialog } from "@/components/pages/entidades/editar-entidade-dialog";
import { EntidadeMembersSection } from "@/components/pages/entidades/entidade-members-section";
import { EntidadeBackButton } from "@/components/pages/entidades/entidade-back-button";
import { EntidadeHeroSection } from "@/components/pages/entidades/entidade-hero-section";
import { EntidadeDescriptionSection } from "@/components/pages/entidades/entidade-description-section";
import { EntidadeOtherEntitiesSection } from "@/components/pages/entidades/entidade-other-entities-section";
import { EntidadeMapSection } from "@/components/pages/entidades/entidade-map-section";
import { isUserAdminOfEntidade } from "@/lib/shared/types/membro.types";
import ProjectCard from "@/components/shared/project-card";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { Layers } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/analytics/posthog-client";

export default function EntidadeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use React Query hooks
  const { data: entidade, isLoading, error: queryError } = useEntidadeBySlug(slug);
  const { data: allEntidades = [] } = useEntidades();

  // Compute other entidades of the same type
  const otherEntidades = useMemo(() => {
    if (!entidade) {
      return [];
    }
    return allEntidades
      .filter(e => e.tipo === entidade.tipo && e.slug !== entidade.slug)
      .slice(0, 8);
  }, [entidade, allEntidades]);

  // Active member count (membros without endedAt are still active)
  const activeMemberCount = useMemo(
    () => entidade?.membros?.filter(m => !m.endedAt).length ?? 0,
    [entidade]
  );

  const canEdit =
    user &&
    (user.papelPlataforma === "MASTER_ADMIN" || isUserAdminOfEntidade(user.id, entidade?.membros));

  // Per-status counts — RASCUNHO/ARQUIVADO only fetched when caller is admin.
  const projetoCounts = useEntidadeProjetoCounts(entidade?.id, !!canEdit);
  const projetoCount = projetoCounts.publicado;

  useEffect(() => {
    if (entidade) {
      trackEvent("entidade_detail_viewed", {
        entidade_name: entidade.name,
        entidade_type: entidade.tipo,
      });
    }
  }, [entidade?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (queryError || !entidade) {
    const errorMessage =
      queryError instanceof Error ? queryError.message : "Entidade não encontrada.";
    return (
      <div className="container mx-auto p-4 pt-12 text-center text-red-500">{errorMessage}</div>
    );
  }

  return (
    <div className="mt-24">
      <div className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 pb-32">
        <EntidadeBackButton />

        <EntidadeHeroSection
          entidade={entidade}
          canEdit={!!canEdit}
          onEditClick={() => setIsEditDialogOpen(true)}
        />

        {/* Tabs */}
        <Tabs defaultValue="projetos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {(
              [
                { label: "Projetos", count: projetoCount },
                { label: "Pessoas", count: activeMemberCount },
                { label: "Sobre", count: null },
              ] as const
            ).map(tab => (
              <TabsTrigger
                key={tab.label}
                value={tab.label
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">{tab.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="border-b border-border/60 my-6" />

          <TabsContent value="projetos" className="mt-0">
            <ProjetosTab entidadeId={entidade.id} canEdit={!!canEdit} counts={projetoCounts} />
          </TabsContent>

          <TabsContent value="pessoas" className="mt-0">
            <EntidadeMembersSection entidade={entidade} />
          </TabsContent>

          <TabsContent value="sobre" className="mt-0">
            <EntidadeDescriptionSection entidade={entidade} />
            <EntidadeMapSection entidade={entidade} />
            <EntidadeOtherEntitiesSection
              currentEntidade={entidade}
              otherEntidades={otherEntidades}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      {entidade && (
        <EditarEntidadeDialog
          entidade={entidade}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={newSlug => {
            if (newSlug && newSlug !== slug) {
              router.push(`/entidade/${newSlug}`);
            } else {
              queryClient.invalidateQueries({ queryKey: queryKeys.entidades.bySlug(slug) });
            }
          }}
        />
      )}
    </div>
  );
}

// Projetos Tab

type ProjetoStatus = "PUBLICADO" | "RASCUNHO" | "ARQUIVADO";

type ProjetosTabProps = {
  entidadeId: string;
  canEdit: boolean;
  counts: { publicado: number; rascunho: number; arquivado: number };
};

function ProjetosTab({ entidadeId, canEdit, counts }: ProjetosTabProps) {
  const [status, setStatus] = useState<ProjetoStatus>("PUBLICADO");
  const { data: projetos, isLoading, error } = useProjetosByEntidade(entidadeId, status);

  const showStatusTabs = canEdit && (counts.rascunho > 0 || counts.arquivado > 0);

  const emptyMessage =
    status === "RASCUNHO"
      ? "Esta entidade não tem projetos em rascunho."
      : status === "ARQUIVADO"
        ? "Esta entidade não tem projetos arquivados."
        : "Esta entidade ainda não possui projetos.";

  return (
    <div className="pb-12">
      {showStatusTabs && (
        <div className="mb-6 flex justify-end">
          <Tabs value={status} onValueChange={v => setStatus(v as ProjetoStatus)}>
            <TabsList>
              <TabsTrigger value="PUBLICADO">
                Publicados
                {counts.publicado > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">{counts.publicado}</span>
                )}
              </TabsTrigger>
              {counts.rascunho > 0 && (
                <TabsTrigger value="RASCUNHO">
                  Rascunhos
                  <span className="ml-2 text-xs text-muted-foreground">{counts.rascunho}</span>
                </TabsTrigger>
              )}
              {counts.arquivado > 0 && (
                <TabsTrigger value="ARQUIVADO">
                  Arquivados
                  <span className="ml-2 text-xs text-muted-foreground">{counts.arquivado}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-sm text-destructive">
          Erro ao carregar os projetos desta entidade.
        </div>
      ) : !projetos || projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Layers className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projetos.map(p => {
            const card = mapProjetoToCard(p);
            return (
              <Link key={card.id} href={`/projetos/${card.id}`}>
                <ProjectCard projeto={card} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
