import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync, statSync } from "fs";

/**
 * Normalizes a string to a slug (same logic as in local-file-guias-provider)
 */
function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Converts a slug back to a folder/filename by searching directory contents
 */
function slugToActualName(slug: string, dirPath: string): string | null {
  if (!existsSync(dirPath)) {
    return null;
  }

  try {
    const stats = statSync(dirPath);
    if (!stats.isDirectory()) {
      return null;
    }

    const entries = readdirSync(dirPath);
    // Normalize the input slug the same way we normalize entries
    const normalizedSlug = normalizeToSlug(slug);

    for (const entry of entries) {
      const entrySlug = normalizeToSlug(entry);

      if (entrySlug === normalizedSlug || entry === slug) {
        return entry;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function readdirSync(dirPath: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  return fs.readdirSync(dirPath);
}

/**
 * Resolves a slug-based path to the actual filesystem path
 */
function resolvePath(slugPath: string[], baseDir: string): string | null {
  if (slugPath.length === 0) {
    return baseDir;
  }

  let currentDir = baseDir;

  // Handle all segments except the last one as directories
  for (let i = 0; i < slugPath.length - 1; i++) {
    const slug = slugPath[i];
    const actualName = slugToActualName(slug, currentDir);
    if (!actualName) {
      return null;
    }

    const nextPath = join(currentDir, actualName);
    if (!existsSync(nextPath)) {
      return null;
    }

    currentDir = nextPath;
  }

  // Last segment might be a file or directory
  const lastSlug = slugPath[slugPath.length - 1];
  const actualName = slugToActualName(lastSlug, currentDir);
  if (!actualName) {
    return null;
  }

  const finalPath = join(currentDir, actualName);
  if (!existsSync(finalPath)) {
    return null;
  }

  return finalPath;
}

export async function GET(_request: unknown, { params }: { params: { path: string[] } }) {
  try {
    const slugPath = params.path;

    // Check if this is an entidades image request (starts with "entidades" or "assets/entidades")
    let contentDir: string;
    let searchPath = slugPath;

    if (slugPath[0] === "entidades" || slugPath[0] === "assets") {
      // Handle entidades images: /api/content-images/entidades/assets/ARIA.png
      // or /api/content-images/assets/entidades/ARIA.png
      if (slugPath[0] === "assets" && slugPath[1] === "entidades") {
        contentDir = join(
          process.cwd(),
          "content",
          "aquario-entidades",
          "centro-de-informatica",
          "assets"
        );
        searchPath = slugPath.slice(2); // Remove "assets/entidades" prefix
      } else if (slugPath[0] === "entidades") {
        contentDir = join(process.cwd(), "content", "aquario-entidades", "centro-de-informatica");
        searchPath = slugPath.slice(1); // Remove "entidades" prefix
      } else {
        contentDir = join(process.cwd(), "content", "aquario-guias");
      }
    } else {
      // Default to guias
      contentDir = join(process.cwd(), "content", "aquario-guias");
    }

    // Security: Ensure we're working within the content directory
    if (!contentDir.startsWith(join(process.cwd(), "content"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // For entidades assets, directly resolve the filename
    let resolvedPath: string | null;
    if (contentDir.includes("aquario-entidades") && contentDir.endsWith("assets")) {
      // Direct file lookup in assets folder
      if (searchPath.length === 0) {
        return new NextResponse("Image not found", { status: 404 });
      }
      const filename = searchPath.join("/");
      resolvedPath = join(contentDir, filename);
    } else {
      // Use the existing slug-based resolution for guias
      resolvedPath = resolvePath(searchPath, contentDir);
    }

    if (!resolvedPath || !existsSync(resolvedPath)) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Security: Ensure the resolved path is within the content directory
    const resolvedFullPath = resolvedPath;
    if (!resolvedFullPath.startsWith(join(process.cwd(), "content"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Read the image file
    const imageBuffer = await readFile(resolvedPath);

    // Determine content type based on file extension
    const ext = resolvedPath.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
