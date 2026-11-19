import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";
import { createLogger } from "@/lib/server/utils/logger";
import { ApiError } from "@/lib/server/errors";
import {
  cleanupOwnedImage,
  InvalidImageError,
  readImageUpload,
  uploadManagedImage,
} from "@/lib/server/services/blob/managed-images";

const log = createLogger("Upload");

export async function POST(request: Request) {
  return await withAuth(request, async (req, usuario) => {
    let uploadedUrl: string | null = null;
    const oldPhotoUrl = usuario.urlFotoPerfil;

    try {
      const file = await readImageUpload(req);
      const { blobStorage, usuariosRepository } = getContainer();
      uploadedUrl = await uploadManagedImage(blobStorage, usuario.id, "photos", file);

      // Update database with new URL
      await usuariosRepository.updateFotoPerfil(usuario.id, uploadedUrl);

      // Fetch updated user to return
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        return ApiError.internal("Erro ao buscar usuário atualizado.");
      }

      if (oldPhotoUrl) {
        await cleanupOwnedImage(blobStorage, usuario.id, oldPhotoUrl);
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      if (error instanceof InvalidImageError) {
        return ApiError.badRequest(error.message);
      }
      if (uploadedUrl) {
        await cleanupOwnedImage(getContainer().blobStorage, usuario.id, uploadedUrl);
      }

      log.error("Error uploading photo", error, { userId: usuario.id });
      return ApiError.internal("Erro ao fazer upload da foto.");
    }
  });
}
