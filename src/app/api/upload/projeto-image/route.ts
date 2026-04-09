import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function POST(req: NextRequest) {
  return withAuth(req, async (req, usuario) => {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "O arquivo deve ser uma imagem" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 5MB)" }, { status: 400 });
    }

    const container = getContainer();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload para blob storage (Vercel Blob ou local)
    const timestamp = Date.now();
    const url = await container.blobStorage.upload(
      buffer,
      `projetos/${usuario.id}-${timestamp}-${file.name}`,
      file.type
    );

    return NextResponse.json({ url }, { status: 201 });
  });
}

export function DELETE(req: NextRequest) {
  return withAuth(req, async (req, usuario) => {
    try {
      const { searchParams } = new URL(req.url);
      const url = searchParams.get("url");

      if (!url) {
        return NextResponse.json({ error: "URL não fornecida" }, { status: 400 });
      }

      // Validate URL structure to prevent authorization bypass
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      }

      const pathSegments = parsedUrl.pathname.split("/");
      const projetosIndex = pathSegments.findIndex(s => s === "projetos");
      if (projetosIndex === -1 || !pathSegments[projetosIndex + 1]?.startsWith(`${usuario.id}-`)) {
        return NextResponse.json(
          { error: "Não autorizado a deletar este arquivo" },
          { status: 403 }
        );
      }

      const container = getContainer();
      const deleted = await container.blobStorage.delete(url);

      // Idempotent delete — return success regardless
      return NextResponse.json({ success: true, deleted }, { status: 200 });
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      return NextResponse.json({ error: "Erro interno ao deletar imagem" }, { status: 500 });
    }
  });
}
