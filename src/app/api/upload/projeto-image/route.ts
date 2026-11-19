import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";
import {
  InvalidImageError,
  retireOwnedImage,
  uploadManagedImage,
} from "@/lib/server/services/blob/managed-images";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  return withAuth(request, async (req, usuario) => {
    try {
      const file = (await req.formData()).get("file");
      const url = await uploadManagedImage(
        getContainer().blobStorage,
        usuario.id,
        "projetos",
        file
      );
      return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
      if (error instanceof InvalidImageError) {
        return ApiError.badRequest(error.message);
      }
      return ApiError.internal("Erro ao enviar imagem.");
    }
  });
}

export function DELETE(request: NextRequest) {
  return withAuth(request, async (req, usuario) => {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) {
      return ApiError.badRequest("URL não fornecida.");
    }
    try {
      const deleted = await retireOwnedImage(getContainer().blobStorage, usuario.id, url);
      return NextResponse.json({ success: true, deleted });
    } catch {
      return ApiError.internal("Erro ao remover imagem.");
    }
  });
}
