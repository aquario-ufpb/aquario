import { put, del, head } from "@vercel/blob";
import type { IBlobStorage } from "./blob-storage.interface";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("BlobStorage");

/**
 * Vercel Blob storage implementation
 * Used in production mode
 *
 * Requires BLOB_READ_WRITE_TOKEN environment variable
 */
export class VercelBlobStorage implements IBlobStorage {
  private readonly token: string;
  private readonly pathPrefix: string;

  constructor(token: string, pathPrefix: string = "") {
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required for Vercel Blob storage");
    }
    this.token = token;
    this.pathPrefix = pathPrefix;
  }

  async upload(file: Buffer | File, path: string, contentType: string): Promise<string> {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

    const blob = await put(this.pathPrefix + path, buffer, {
      access: "public",
      contentType,
      token: this.token,
    });

    return blob.url;
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      // Only delete if it's a Vercel Blob URL (contains .blob.vercel-storage.com)
      // Skip local paths or other URLs
      if (!urlOrPath.includes(".blob.vercel-storage.com")) {
        return false;
      }

      // In staging/preview, only delete blobs that belong to this environment.
      // This protects production photos when staging copies the prod database.
      if (this.pathPrefix && !urlOrPath.includes(`/${this.pathPrefix}`)) {
        return false;
      }

      // Vercel Blob del() expects the full URL, not just the path
      await del(urlOrPath, { token: this.token });
      return true;
    } catch (error) {
      log.error("Error deleting blob", error, { url: urlOrPath });
      return false;
    }
  }

  async exists(urlOrPath: string): Promise<boolean> {
    try {
      // Vercel Blob head() expects the full URL, not just the path
      const result = await head(urlOrPath, { token: this.token });
      return !!result;
    } catch {
      return false;
    }
  }
}
