import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError } from "@/lib/server/errors";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// SVG is intentionally excluded — `next.config.mjs` has `dangerouslyAllowSVG: true`
// for legitimate uses elsewhere, and an SVG can carry <script> + event handlers.
// Mirrors `/api/upload/photo`. Renderer-side defenses (CSP, react-markdown) are
// secondary; the upload boundary is the primary control.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * Sanitize a user-supplied filename for use inside a storage key.
 * Strips path-traversal chars, separators, and anything outside [A-Za-z0-9._-].
 * Caps length so a multi-MB filename can't bloat the key.
 */
function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 80) || "file";
}

/**
 * Validate that a delete URL points at one of our blob backends — either the
 * local /uploads/ prefix or a Vercel blob host. Defends against attacker-crafted
 * URLs being passed to blobStorage.delete().
 */
function isOurBlobUrl(parsed: URL): boolean {
  // Local backend returns paths like "/uploads/projetos/..."; we resolve against
  // a placeholder origin so root-relative paths still parse.
  if (parsed.hostname === "placeholder") {
    return parsed.pathname.startsWith("/uploads/projetos/");
  }
  // Vercel Blob URLs are <store>.public.blob.vercel-storage.com
  return parsed.protocol === "https:" && parsed.hostname.endsWith(".blob.vercel-storage.com");
}

export function POST(req: NextRequest) {
  return withAuth(req, async (req, usuario) => {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return ApiError.badRequest("Arquivo não fornecido");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return ApiError.badRequest("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
    }

    if (file.size > MAX_FILE_SIZE) {
      return ApiError.badRequest("Arquivo muito grande (máximo 5MB)");
    }

    const container = getContainer();
    const buffer = Buffer.from(await file.arrayBuffer());

    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const url = await container.blobStorage.upload(
      buffer,
      `projetos/${usuario.id}-${timestamp}-${safeName}`,
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
        return ApiError.badRequest("URL não fornecida");
      }

      let parsedUrl: URL;
      try {
        // Accept absolute URLs (Vercel) and root-relative paths (local) by
        // resolving against a placeholder origin.
        parsedUrl = new URL(url, "http://placeholder");
      } catch {
        return ApiError.badRequest("URL inválida");
      }

      // Defense-in-depth: ensure the URL points at one of our blob backends
      // before forwarding to blobStorage.delete(). Without this, an attacker
      // could pass any URL whose path happens to match the auth check below.
      if (!isOurBlobUrl(parsedUrl)) {
        return ApiError.forbidden("URL não corresponde ao armazenamento configurado");
      }

      const pathSegments = parsedUrl.pathname.split("/");
      const projetosIndex = pathSegments.findIndex(s => s === "projetos");
      // The next segment must start with "<userId>-" — your own uploads only.
      if (projetosIndex === -1 || !pathSegments[projetosIndex + 1]?.startsWith(`${usuario.id}-`)) {
        return ApiError.forbidden("Não autorizado a deletar este arquivo");
      }

      const container = getContainer();
      const deleted = await container.blobStorage.delete(url);

      // Idempotent delete — return success regardless
      return NextResponse.json({ success: true, deleted }, { status: 200 });
    } catch (error) {
      console.error("Erro ao deletar imagem:", error);
      return ApiError.internal("Erro interno ao deletar imagem");
    }
  });
}
