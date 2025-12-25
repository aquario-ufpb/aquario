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
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";

export default function PerfilPage() {
  const { isEnabled: backendEnabled } = useBackend();
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth(); // Only for auth check/redirect
  const { data: user, isLoading: userLoading } = useCurrentUser(); // Get user from React Query
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      await uploadPhotoMutation.mutateAsync(file);
      // React Query automatically refetches user data after mutation
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da foto.");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          <div className="relative group mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.urlFotoPerfil || undefined} alt={user.nome} />
              <AvatarFallback className="text-3xl">{getInitials(user.nome)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoMutation.isPending}
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploadPhotoMutation.isPending
                ? "Enviando..."
                : user.urlFotoPerfil
                  ? "Alterar Foto"
                  : "Adicionar Foto"}
            </Button>
            {user.urlFotoPerfil && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePhoto}
                disabled={deletePhotoMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletePhotoMutation.isPending ? "Removendo..." : "Remover"}
              </Button>
            )}
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
    </main>
  );
}
