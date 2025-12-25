import { writeFile, mkdir, unlink, access } from "fs/promises";
import { join, normalize, resolve, dirname } from "path";
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
    const dirPath = dirname(fullPath);

    if (dirPath && !existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Validate path to prevent path traversal attacks
   * Ensures the path doesn't contain ".." or escape baseDir
   */
  private validatePath(path: string): void {
    // Normalize the path to resolve any ".." or "." components
    const normalizedPath = normalize(path);

    // Check for path traversal attempts
    if (
      normalizedPath.includes("..") ||
      normalizedPath.startsWith("/") ||
      normalizedPath.startsWith("\\")
    ) {
      throw new Error("Invalid path: path traversal detected");
    }

    // Ensure the resolved path stays within baseDir
    const fullPath = resolve(this.baseDir, normalizedPath);
    const resolvedBase = resolve(this.baseDir);

    if (!fullPath.startsWith(resolvedBase)) {
      throw new Error("Invalid path: path escapes base directory");
    }
  }

  /**
   * Convert a storage path to a file system path
   */
  private getFilePath(path: string): string {
    this.validatePath(path);
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
    const prefix = this.publicUrl + "/";
    if (urlOrPath.startsWith(prefix)) {
      return urlOrPath.slice(prefix.length);
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
