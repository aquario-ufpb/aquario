/**
 * Blob storage interface for photo/file uploads
 *
 * This interface abstracts the storage implementation,
 * allowing for different providers (local, Vercel Blob, S3, etc.)
 */
export type IBlobStorage = {
  /**
   * Upload a file and return its public URL
   * @param file - The file to upload (Buffer or File)
   * @param path - The path/key where the file should be stored (e.g., "photos/user-123.jpg")
   * @param contentType - MIME type of the file (e.g., "image/jpeg")
   * @returns The public URL of the uploaded file
   */
  upload(file: Buffer | File, path: string, contentType: string): Promise<string>;

  /**
   * Delete a file by its URL or path
   * @param urlOrPath - The public URL or storage path of the file to delete
   * @returns true if the file was deleted, false if it didn't exist
   */
  delete(urlOrPath: string): Promise<boolean>;

  /**
   * Check if a file exists
   * @param urlOrPath - The public URL or storage path of the file
   * @returns true if the file exists, false otherwise
   */
  exists(urlOrPath: string): Promise<boolean>;
};
