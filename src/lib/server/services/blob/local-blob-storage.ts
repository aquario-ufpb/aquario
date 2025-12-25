import { writeFile, mkdir, unlink, access } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import type { IBlobStorage } from "./blob-storage.interface";

/**
 * Local file system blob storage implementation
 * Used in development mode
 *
 * Stores files in the public/uploads directory
 */
export class LocalBlobStorage implements IBlobStorage {
  private readonly baseDir: string;
  private readonly publicUrl: string;

  constructor() {
    // Store in public/uploads so files are accessible via Next.js static serving
    this.baseDir = join(process.cwd(), "public", "uploads");
    this.publicUrl = "/uploads";
  }

  /**
   * Ensure the upload directory exists
   */
  private async ensureDirectory(path: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    // Extract directory part (everything before the last /)
    const lastSlashIndex = Math.max(fullPath.lastIndexOf("/"), fullPath.lastIndexOf("\\"));
    if (lastSlashIndex === -1) {
      return; // No directory part
    }
    const dirPath = fullPath.substring(0, lastSlashIndex);

    if (dirPath && !existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Convert a storage path to a file system path
   */
  private getFilePath(path: string): string {
    return join(this.baseDir, path);
  }

  /**
   * Convert a storage path to a public URL
   */
  private getPublicUrl(path: string): string {
    return `${this.publicUrl}/${path}`;
  }

  /**
   * Extract path from URL (for delete operations)
   */
  private extractPath(urlOrPath: string): string {
    if (urlOrPath.startsWith(this.publicUrl)) {
      return urlOrPath.replace(this.publicUrl + "/", "");
    }
    return urlOrPath;
  }

  async upload(file: Buffer | File, path: string, _contentType: string): Promise<string> {
    await this.ensureDirectory(path);

    const filePath = this.getFilePath(path);
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

    await writeFile(filePath, buffer);

    return this.getPublicUrl(path);
  }

  async delete(urlOrPath: string): Promise<boolean> {
    try {
      const path = this.extractPath(urlOrPath);
      const filePath = this.getFilePath(path);

      // Check if file exists
      try {
        await access(filePath);
      } catch {
        return false; // File doesn't exist
      }

      await unlink(filePath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  async exists(urlOrPath: string): Promise<boolean> {
    try {
      const path = this.extractPath(urlOrPath);
      const filePath = this.getFilePath(path);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
