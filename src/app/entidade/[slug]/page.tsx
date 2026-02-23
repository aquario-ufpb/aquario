"use client";

import { useState, useMemo, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEntidadeBySlug, useEntidades } from "@/lib/client/hooks";
import { useProjetosByEntidade } from "@/lib/client/hooks/use-projetos";
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
import ProjectCard, { type Projeto as ProjetoCard } from "@/components/shared/project-card";
import { Layers } from "lucide-react";
import Link from "next/link";

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

        {/* Tabs */}
        <Tabs defaultValue="projetos" className="mt-2">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto gap-0">
            {(["Projetos", "Pessoas", "Sobre"] as const).map(tab => (
              <TabsTrigger
                key={tab}
                value={tab
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")}
                className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="projetos" className="mt-6">
            <ProjetosTab
              entidadeId={entidade.id}
              entidadeNome={entidade.name}
              entidadeImagem={entidade.imagePath}
            />
          </TabsContent>

          <TabsContent value="pessoas" className="mt-0">
            <EntidadeMembersSection entidade={entidade} />
          </TabsContent>

          <TabsContent value="sobre" className="mt-6">
            <EntidadeDescriptionSection entidade={entidade} />
            <EntidadeMapSection entidade={entidade} />
          </TabsContent>
        </Tabs>

        {/* "Outros..." section always visible below tabs */}
        <EntidadeOtherEntitiesSection currentEntidade={entidade} otherEntidades={otherEntidades} />
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

type ProjetosTabProps = {
  entidadeId: string;
  entidadeNome: string;
  entidadeImagem: string;
};

function ProjetosTab({ entidadeId, entidadeNome, entidadeImagem }: ProjetosTabProps) {
  const { data: projetos, isLoading } = useProjetosByEntidade(entidadeId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!projetos || projetos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Layers className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">Esta entidade ainda não possui projetos.</p>
      </div>
    );
  }

  // Map Prisma Projeto to ProjectCard Projeto shape
  const cards: ProjetoCard[] = projetos.map(p => ({
    id: p.id,
    nome: p.titulo,
    descricao: p.descricao ?? "",
    imagem: p.urlImagem ?? null,
    tipo: (p.entidade?.tipo ?? "LABORATORIO") as ProjetoCard["tipo"],
    tags: p.tags ?? [],
    publicador: {
      id: entidadeId,
      nome: entidadeNome,
      urlFotoPerfil: entidadeImagem,
      tipo: "ENTIDADE" as const,
    },
    colaboradores: (p.autores ?? []).map(a => ({
      id: a.usuario.id,
      nome: a.usuario.nome,
      urlFotoPerfil: a.usuario.urlFotoPerfil ?? null,
    })),
    linkRepositorio: p.urlRepositorio ?? undefined,
    criadoEm: p.criadoEm.toString(),
  }));

  return (
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
        {cards.map(card => (
          <Link
            key={card.id}
            href={`/projetos/${projetos.find(p => p.id === card.id)?.slug ?? card.id}`}
          >
            <ProjectCard projeto={card} />
          </Link>
        ))}
      </div>
    </div>
  );
}
