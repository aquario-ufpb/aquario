"use client";

import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useUploadPhoto, useDeletePhoto, useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBackend } from "@/lib/shared/config/env";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { PhotoCropDialog } from "@/components/shared/photo-crop-dialog";

export default function PerfilPage() {
  const { isEnabled: backendEnabled } = useBackend();
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth(); // Only for auth check/redirect
  const { data: user, isLoading: userLoading } = useCurrentUser(); // Get user from React Query
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  // Cleanup object URL on unmount or when URL changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    };
  }, [selectedImageUrl]);

  // Redirect to home if backend is disabled
  useEffect(() => {
    if (!backendEnabled) {
      router.replace("/");
    }
  }, [backendEnabled, router]);

  if (!backendEnabled) {
    return null;
  }

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

    // Clean up object URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
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
      console.error("Error uploading photo:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da foto.");
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    // Clean up object URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
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
      // React Query automatically refetches user data after mutation
      toast.success("Foto de perfil removida com sucesso!");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover foto de perfil.");
    }
  };

  if (authLoading || userLoading || !user) {
    return (
      <div className="container mx-auto max-w-4xl p-4 pt-24">
        <Card className="p-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl p-4 pt-24">
      <Card>
        <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/50">
          <div className="relative mb-6 w-24 h-24">
            {/* Avatar */}
            <div className="relative group w-full h-full">
              <Avatar className="w-full h-full">
                <AvatarImage src={user.urlFotoPerfil || undefined} alt={user.nome} />
                <AvatarFallback className="text-3xl">{getInitials(user.nome)}</AvatarFallback>
              </Avatar>

              {/* Hover overlay for upload/change */}
              {!uploadPhotoMutation.isPending && (
                <div
                  role="button"
                  tabIndex={0}
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
                </div>
              )}

              {/* Loading overlay */}
              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Delete button badge (only when photo exists and not uploading) */}
            {user.urlFotoPerfil && !uploadPhotoMutation.isPending && (
              <button
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadPhotoMutation.isPending}
            />
          </div>

          <CardTitle className="text-3xl font-bold">{user.nome}</CardTitle>
          <CardDescription className="text-lg">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Centro</span>
              <span className="text-lg font-medium">
                {user.centro.sigla} - {user.centro.nome}
              </span>
            </div>
            <div className="flex flex-col space-y-1 rounded-lg border p-3">
              <span className="text-sm font-semibold text-muted-foreground">Curso</span>
              <span className="text-lg font-medium">{user.curso.nome}</span>
            </div>
            {user.papelPlataforma === "MASTER_ADMIN" && (
              <div className="flex flex-col space-y-1 rounded-lg border p-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Papel na Plataforma
                </span>
                <span className="text-lg font-medium">Administrador</span>
              </div>
            )}
          </div>

          {user.papelPlataforma === "MASTER_ADMIN" && (
            <div className="mt-4">
              <Link href="/admin">
                <Button className="w-full">Painel de Administração</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoCropDialog
        open={cropDialogOpen}
        imageUrl={selectedImageUrl}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </main>
  );
}
