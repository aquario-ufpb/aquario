import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";
import { z } from "zod";

const updatePhotoSchema = z.object({
  urlFotoPerfil: z.string().url().nullable().optional(),
});

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

      // If updating to a new photo, delete the old one if it exists
      if (usuario.urlFotoPerfil && usuario.urlFotoPerfil !== urlFotoPerfil) {
        // Only delete if it's from our blob storage (not external URLs)
        try {
          await blobStorage.delete(usuario.urlFotoPerfil);
        } catch (error) {
          // Ignore errors when deleting old photo (might be external URL)
          console.warn("Could not delete old photo:", error);
        }
      }

      // Update user's photo URL
      await usuariosRepository.updatePhotoPerfil(usuario.id, urlFotoPerfil ?? null);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        return NextResponse.json(
          { message: "Erro ao buscar usuário atualizado." },
          { status: 500 }
        );
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: "Dados inválidos.", errors: error.errors },
          { status: 400 }
        );
      }

      console.error("Error updating profile photo:", error);
      return NextResponse.json({ message: "Erro ao atualizar foto de perfil." }, { status: 500 });
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

      // Delete the photo from storage if it exists
      if (usuario.urlFotoPerfil) {
        try {
          await blobStorage.delete(usuario.urlFotoPerfil);
        } catch (error) {
          // Ignore errors when deleting (might be external URL or already deleted)
          console.warn("Could not delete photo:", error);
        }
      }

      // Update user's photo URL to null
      await usuariosRepository.updatePhotoPerfil(usuario.id, null);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(usuario.id);
      if (!updatedUser) {
        return NextResponse.json(
          { message: "Erro ao buscar usuário atualizado." },
          { status: 500 }
        );
      }

      return NextResponse.json(formatUserResponse(updatedUser));
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      return NextResponse.json({ message: "Erro ao deletar foto de perfil." }, { status: 500 });
    }
  });
}
