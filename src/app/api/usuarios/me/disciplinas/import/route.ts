import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { ErrorCode } from "@/lib/shared/errors";
import { createLogger } from "@/lib/server/utils/logger";
import { extractPdfText } from "@/lib/server/services/academic-import/pdf-text-extractor";
import { buildImportPreview } from "@/lib/server/services/academic-import/build-import-preview";

export const dynamic = "force-dynamic";

const log = createLogger("AcademicImport");

/** Maximum accepted upload size. Atestados are small (well under 1MB). */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Accepted content types for the uploaded document. */
const PDF_CONTENT_TYPES = ["application/pdf", "application/x-pdf"];

/**
 * POST /api/usuarios/me/disciplinas/import
 *
 * Parses an uploaded SIGAA "Atestado de Matrícula" PDF and returns a preview of
 * the enrolled components matched against the Disciplina catalog. Nothing is
 * persisted — the user reviews the preview and confirms via the existing
 * enrollment endpoints. The PDF (which carries matrícula + full name) is parsed
 * in-memory and never stored.
 */
export function POST(request: Request) {
  return withAuth(request, async req => {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return ApiError.badRequest("Envie o arquivo como multipart/form-data.");
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return ApiError.badRequest("Nenhum arquivo enviado.", ErrorCode.EMPTY_PDF);
    }

    if (file.size > MAX_FILE_SIZE) {
      return ApiError.badRequest(
        "Arquivo muito grande. Tamanho máximo: 5MB.",
        ErrorCode.FILE_TOO_LARGE
      );
    }

    if (!PDF_CONTENT_TYPES.includes(file.type)) {
      return ApiError.badRequest(
        "Tipo de arquivo não permitido. Envie um PDF.",
        ErrorCode.INVALID_FILE_TYPE
      );
    }

    let text: string;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractPdfText(buffer);
    } catch (error) {
      log.warn("Failed to extract text from PDF", { error: String(error) });
      return ApiError.badRequest("Não foi possível ler o PDF enviado.", ErrorCode.EMPTY_PDF);
    }

    if (text.trim().length === 0) {
      return ApiError.badRequest("O PDF não contém texto legível.", ErrorCode.EMPTY_PDF);
    }

    const { disciplinaRepository } = getContainer();

    let preview;
    try {
      preview = await buildImportPreview(text, codigos =>
        disciplinaRepository.findByCodigos(codigos)
      );
    } catch (error) {
      log.error("Failed to build import preview", error);
      return ApiError.internal("Erro ao processar o documento.");
    }

    if (!preview) {
      return ApiError.badRequest(
        "Documento não reconhecido. Envie um Atestado de Matrícula do SIGAA.",
        ErrorCode.UNSUPPORTED_DOCUMENT
      );
    }

    return NextResponse.json(preview);
  });
}
