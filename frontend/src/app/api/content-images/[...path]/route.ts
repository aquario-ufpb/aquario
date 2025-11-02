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

    // Construct the full path to the content directory
    const contentDir = join(process.cwd(), "content", "aquario-guias");

    // Security: Ensure we're working within the content directory
    if (!contentDir.startsWith(join(process.cwd(), "content"))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Resolve slug path to actual filesystem path
    const resolvedPath = resolvePath(slugPath, contentDir);

    if (!resolvedPath || !existsSync(resolvedPath)) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Security: Ensure the resolved path is within the content directory
    const resolvedFullPath = resolvedPath;
    if (!resolvedFullPath.startsWith(contentDir)) {
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
