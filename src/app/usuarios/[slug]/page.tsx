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

export default function UserProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: user, isLoading, error: queryError } = useUsuarioBySlug(slug);
  const { data: currentUser } = useCurrentUser();
  const { data: memberships, isLoading: membershipsLoading } = useUserMemberships(user?.id || "");
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [showAllEntities, setShowAllEntities] = useState(false);

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser?.id === user?.id;

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
    <main className="container mx-auto max-w-7xl px-6 md:px-8 lg:px-16 pt-24">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-8 pb-8 border-b">
        <div className="relative mb-6 w-24 h-24 mx-auto">
          {/* Avatar */}
          <div className="relative group w-full h-full">
            <Avatar className="w-full h-full">
              <AvatarImage
                src={user.urlFotoPerfil || getDefaultAvatarUrl(user.id, user.eFacade)}
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

        <h1 className="text-3xl font-bold mb-2">{user.nome}</h1>
        <p className="text-lg text-muted-foreground mb-6">{user.email}</p>

        {/* Info Grid */}
        <div className="grid gap-4 md:grid-cols-2 w-full">
          <div className="flex flex-col space-y-1 text-left">
            <span className="text-sm font-semibold text-muted-foreground">Centro</span>
            <span className="text-base">
              {user.centro.sigla} - {user.centro.nome}
            </span>
          </div>
          <div className="flex flex-col space-y-1 text-left">
            <span className="text-sm font-semibold text-muted-foreground">Curso</span>
            <span className="text-base">{user.curso.nome}</span>
          </div>
          {user.papelPlataforma === "MASTER_ADMIN" && (
            <div className="flex flex-col space-y-1 text-left">
              <span className="text-sm font-semibold text-muted-foreground">
                Papel na Plataforma
              </span>
              <span className="text-base">Administrador</span>
            </div>
          )}
        </div>

        {isOwnProfile && user.papelPlataforma === "MASTER_ADMIN" && (
          <div className="mt-6 w-full">
            <Link href="/admin">
              <Button className="w-full">Painel de Administração</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Tabs for Entidades and Timeline */}
      <div className="mt-8">
        <Tabs defaultValue="entidades" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entidades">Entidades</TabsTrigger>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          </TabsList>

          <TabsContent value="entidades" className="mt-6">
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
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
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
