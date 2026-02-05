import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";

/**
 * POST /api/upload/photo
 * Upload a profile photo and update the database atomically
 * This ensures the photo URL in the database always matches what's in storage
 */
export async function POST(request: Request) {
  return await withAuth(request, async (req, usuario) => {
    let uploadedUrl: string | null = null;
    const oldPhotoUrl = usuario.urlFotoPerfil;

    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { message: "Arquivo muito grande. Tamanho máximo: 5MB." },
          { status: 400 }
        );
      }

      const { blobStorage, usuariosRepository } = getContainer();

      // Map MIME type to safe file extension (don't trust user-provided filename)
      const mimeToExtension: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg", // Non-standard but some browsers send this
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const extension = mimeToExtension[file.type] || "jpg";
      const timestamp = Date.now();
      const filename = `photos/${usuario.id}-${timestamp}.${extension}`;

      // Delete old photo from storage if it exists
      if (oldPhotoUrl) {
        try {
          await blobStorage.delete(oldPhotoUrl);
        } catch (error) {
          console.warn("Could not delete old photo:", error);
        }
      }

      // Upload new file
      uploadedUrl = await blobStorage.upload(file, filename, file.type);

      // Update database with new URL
      await usuariosRepository.updateFotoPerfil(usuario.id, uploadedUrl);

      // Fetch updated user to return
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        // If we can't fetch the user, try to clean up the uploaded file
        if (uploadedUrl) {
          try {
            await blobStorage.delete(uploadedUrl);
          } catch (cleanupError) {
            console.error("Failed to cleanup uploaded file after user fetch error:", cleanupError);
          }
        }
        return NextResponse.json(
          { message: "Erro ao buscar usuário atualizado." },
          { status: 500 }
        );
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      // If upload succeeded but database update failed, try to clean up the uploaded file
      if (uploadedUrl) {
        try {
          const { blobStorage } = getContainer();
          await blobStorage.delete(uploadedUrl);
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded file after error:", cleanupError);
        }
      }

      console.error("Error uploading photo:", error);
      return NextResponse.json({ message: "Erro ao fazer upload da foto." }, { status: 500 });
    }
  });
}
