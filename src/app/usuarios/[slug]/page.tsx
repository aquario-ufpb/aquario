"use client";

import { use, useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultAvatarUrl } from "@/lib/client/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  useUsuarioBySlug,
  useUserMemberships,
  useCurrentUser,
  useUploadPhoto,
  useDeletePhoto,
} from "@/lib/client/hooks/use-usuarios";
import { EntidadesTab } from "@/components/pages/perfil/entidades-tab";
import { TimelineTab } from "@/components/pages/perfil/timeline-tab";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { PhotoCropDialog } from "@/components/shared/photo-crop-dialog";
import { ProgressoCursoCard } from "@/components/pages/perfil/progresso-curso-card";
import { useProjetosByUsuario } from "@/lib/client/hooks/use-projetos";
import ProjectCard from "@/components/shared/project-card";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { trackEvent } from "@/analytics/posthog-client";

export default function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: user, isLoading, error: queryError } = useUsuarioBySlug(slug);
  const { data: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const { data: memberships, isLoading: membershipsLoading } = useUserMemberships(user?.id || "");
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [showAllEntities, setShowAllEntities] = useState(false);
  const {
    data: projetos,
    isLoading: projetosLoading,
    error: projetosError,
  } = useProjetosByUsuario(user?.id);

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === user?.id;

  // Track profile views of other users
  useEffect(() => {
    if (!user?.id || isCurrentUserLoading || isOwnProfile) {
      return;
    }
    trackEvent("usuario_profile_viewed", { user_slug: slug });
  }, [slug, user?.id, isOwnProfile, isCurrentUserLoading]);

  // Cleanup object URL on unmount or when URL changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    };
  }, [selectedImageUrl]);

  const getInitials = (name: string) => {
    const names = name.split(" ");
    const initials = names.map(n => n[0]).join("");
    return initials.toUpperCase().slice(0, 2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB.");
      return;
    }

    // Create object URL for the crop dialog
    const imageUrl = URL.createObjectURL(file);
    setSelectedImageUrl(imageUrl);
    setCropDialogOpen(true);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    // Close dialog immediately to prevent multiple clicks
    setCropDialogOpen(false);

    // Clean up object URL and reset state
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl("");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Create a File object from the cropped blob
    const croppedFile = new File([croppedBlob], "profile-photo.jpg", { type: "image/jpeg" });

    try {
      await uploadPhotoMutation.mutateAsync(croppedFile);
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da foto.");
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    // Clean up object URL and reset state
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
      setSelectedImageUrl("");
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.urlFotoPerfil) {
      return;
    }

    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) {
      return;
    }

    try {
      await deletePhotoMutation.mutateAsync();
      toast.success("Foto de perfil removida com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover foto de perfil.");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 pt-24">
        <div className="flex flex-col items-center space-y-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (queryError || !user) {
    const errorMessage =
      queryError instanceof Error ? queryError.message : "Usuário não encontrado.";
    return (
      <div className="container mx-auto p-4 pt-24 text-center text-red-500">{errorMessage}</div>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 pt-36 pb-32">
      {/* Profile Header — Dribbble-style: avatar left, info right, group centered */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-10 mb-8">
        {/* Avatar */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 mx-auto md:mx-0">
          <div className="relative group w-full h-full">
            <Avatar className="w-full h-full">
              <AvatarImage
                src={user.urlFotoPerfil || getDefaultAvatarUrl(user.id, user.nome, user.eFacade)}
                alt={user.nome}
              />
              <AvatarFallback className="text-3xl">{getInitials(user.nome)}</AvatarFallback>
            </Avatar>

            {/* Hover overlay for upload/change (only for own profile) */}
            {isOwnProfile && !uploadPhotoMutation.isPending && (
              <button
                type="button"
                aria-label="Alterar foto de perfil"
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-full cursor-pointer"
                style={{
                  transition: "opacity 0.2s",
                  transform: "translateZ(0)",
                  willChange: "opacity",
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Camera className="text-white" size={20} strokeWidth={2} />
              </button>
            )}

            {/* Loading overlay */}
            {isOwnProfile && uploadPhotoMutation.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Delete button badge (only when photo exists, not uploading, and own profile) */}
          {isOwnProfile && user.urlFotoPerfil && !uploadPhotoMutation.isPending && (
            <button
              type="button"
              aria-label="Remover foto de perfil"
              className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center bg-neutral-800 dark:bg-neutral-700 text-white rounded-full shadow-md disabled:opacity-50 outline-none border-0 p-0 m-0"
              style={{
                transition: "background-color 0.2s",
                transform: "translateZ(0)",
              }}
              onMouseEnter={e => {
                if (!deletePhotoMutation.isPending) {
                  e.currentTarget.style.backgroundColor = "rgb(239 68 68)"; // red-500
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "";
              }}
              onClick={handleDeletePhoto}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 flex-shrink-0" />
              )}
            </button>
          )}

          {/* Hidden file input (only for own profile) */}
          {isOwnProfile && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadPhotoMutation.isPending}
            />
          )}
        </div>

        {/* Right column — name + info + actions */}
        <div className="flex flex-col gap-1 min-w-0 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-1">{user.nome}</h1>
          <p className="text-base md:text-lg text-foreground/80">
            {user.centro.sigla} — {user.centro.nome}
          </p>
          <p className="text-base text-muted-foreground">{user.curso.nome}</p>
          {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}

          {isOwnProfile && user.papelPlataforma === "MASTER_ADMIN" && (
            <div className="flex justify-center md:justify-start mt-2">
              <Link href="/admin">
                <Button className="rounded-full">Painel de Administração</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Course progress */}
      {user && (
        <div className="mt-6">
          <ProgressoCursoCard
            cursoId={user.curso.id}
            cursoNome={user.curso.nome}
            isOwnProfile={isOwnProfile}
          />
        </div>
      )}

      {/* Tabs for Projetos, Entidades and Timeline */}
      <div className="mt-24">
        <Tabs defaultValue="projetos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projetos">
              Projetos
              {projetos && projetos.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">{projetos.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="entidades">
              Entidades
              {memberships && memberships.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">{memberships.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          </TabsList>

          <div className="border-b border-border/60 my-6" />

          {/* Entidades */}
          <TabsContent value="entidades" className="mt-0">
            <EntidadesTab
              memberships={memberships}
              isLoading={membershipsLoading}
              showAllEntities={showAllEntities}
              onShowAllEntitiesChange={setShowAllEntities}
              title={isOwnProfile ? "Minhas Entidades" : "Entidades"}
              emptyMessage={
                isOwnProfile
                  ? "Você não é membro de nenhuma entidade ainda."
                  : "Este usuário não é membro de nenhuma entidade ainda."
              }
              isOwnProfile={isOwnProfile}
            />
          </TabsContent>

          {/* Projetos */}
          <TabsContent value="projetos" className="mt-0">
            <h2 className="text-xl font-semibold mb-6">
              {isOwnProfile ? "Meus Projetos" : "Projetos"}
            </h2>

            {projetosLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            )}

            {!projetosLoading && projetosError && (
              <p className="text-destructive text-sm">Erro ao carregar projetos.</p>
            )}

            {!projetosLoading && !projetosError && (!projetos || projetos.length === 0) && (
              <p className="text-muted-foreground text-sm">
                {isOwnProfile
                  ? "Você ainda não publicou nenhum projeto."
                  : "Este usuário ainda não publicou projetos."}
              </p>
            )}

            {!projetosLoading && !projetosError && projetos && projetos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-0">
            <TimelineTab
              memberships={memberships}
              isLoading={membershipsLoading}
              title={isOwnProfile ? "Histórico de Membros" : "Linha do Tempo"}
              emptyMessage={
                isOwnProfile
                  ? "Nenhum histórico de membros encontrado."
                  : "Este usuário não possui histórico de membros."
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && (
        <PhotoCropDialog
          open={cropDialogOpen}
          imageUrl={selectedImageUrl}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </main>
  );
}
