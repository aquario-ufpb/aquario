import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";
import { z } from "zod";
import { createLogger } from "@/lib/server/utils/logger";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { updatePhotoSchema } from "@/lib/server/api-schemas/usuarios";

const log = createLogger("Photo");

/**
 * PATCH /api/usuarios/me/photo
 * Update current user's profile photo URL
 */
export async function PATCH(request: Request) {
  return await withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const { urlFotoPerfil } = updatePhotoSchema.parse(body);

      const { usuariosRepository, blobStorage } = getContainer();

      // Update user's photo URL
      await usuariosRepository.updateFotoPerfil(usuario.id, urlFotoPerfil ?? null);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        return ApiError.internal("Erro ao buscar usuário atualizado.");
      }

      // Delete the old photo only after the database no longer points to it.
      if (usuario.urlFotoPerfil && usuario.urlFotoPerfil !== urlFotoPerfil) {
        try {
          await blobStorage.delete(usuario.urlFotoPerfil);
        } catch (error) {
          log.warn("Could not delete old photo", {
            url: usuario.urlFotoPerfil,
            error: String(error),
          });
        }
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      log.error("Error updating profile photo", error, { userId: usuario.id });
      return ApiError.internal("Erro ao atualizar foto de perfil.");
    }
  });
}

/**
 * DELETE /api/usuarios/me/photo
 * Delete current user's profile photo
 */
export async function DELETE(request: Request) {
  return await withAuth(request, async (_req, usuario) => {
    try {
      const { usuariosRepository, blobStorage } = getContainer();

      // Update user's photo URL to null
      await usuariosRepository.updateFotoPerfil(usuario.id, null);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        return ApiError.internal("Erro ao buscar usuário atualizado.");
      }

      // Delete the photo from storage after the database no longer references it.
      if (usuario.urlFotoPerfil) {
        try {
          await blobStorage.delete(usuario.urlFotoPerfil);
        } catch (error) {
          log.warn("Could not delete photo", { url: usuario.urlFotoPerfil, error: String(error) });
        }
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      log.error("Error deleting profile photo", error, { userId: usuario.id });
      return ApiError.internal("Erro ao deletar foto de perfil.");
    }
  });
}
