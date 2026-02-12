"use client";

import { useState, useMemo, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntidadeBySlug, useEntidades } from "@/lib/client/hooks";
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
      .slice(0, 8); // Limit to 8 similar entities
  }, [entidade, allEntidades]);

  const canEdit =
    user &&
    (user.papelPlataforma === "MASTER_ADMIN" || isUserAdminOfEntidade(user.id, entidade?.membros));

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
      <div className="container mx-auto max-w-7xl">
        <EntidadeBackButton />

        <EntidadeHeroSection
          entidade={entidade}
          canEdit={!!canEdit}
          onEditClick={() => setIsEditDialogOpen(true)}
        />

        <EntidadeDescriptionSection entidade={entidade} />

        <EntidadeMembersSection entidade={entidade} />

        <EntidadeMapSection entidade={entidade} />

        <EntidadeOtherEntitiesSection currentEntidade={entidade} otherEntidades={otherEntidades} />
      </div>

      {/* Edit Dialog */}
      {entidade && (
        <EditarEntidadeDialog
          entidade={entidade}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={newSlug => {
            // If slug changed, redirect to new URL
            if (newSlug && newSlug !== slug) {
              router.push(`/entidade/${newSlug}`);
            } else {
              // Otherwise, invalidate and refetch entidade data
              queryClient.invalidateQueries({ queryKey: queryKeys.entidades.bySlug(slug) });
            }
          }}
        />
      )}
    </div>
  );
}
