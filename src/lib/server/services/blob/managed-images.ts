import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/server/db/prisma";
import { createLogger } from "@/lib/server/utils/logger";
import type { IBlobStorage } from "./blob-storage.interface";

const log = createLogger("ManagedImages");
const maxBytes = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]);

export class InvalidImageError extends Error {}

function hasRasterSignature(bytes: Buffer) {
  return (
    bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    ["GIF87a", "GIF89a"].includes(bytes.toString("latin1", 0, 6)) ||
    (bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP")
  );
}

export async function uploadManagedImage(
  storage: IBlobStorage,
  uploaderId: string,
  directory: "photos" | "projetos",
  file: FormDataEntryValue | null
) {
  if (!(file instanceof File) || !allowedTypes.has(file.type)) {
    throw new InvalidImageError("Envie uma imagem JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > maxBytes) {
    throw new InvalidImageError("Arquivo muito grande (máximo 5 MB).");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasRasterSignature(bytes)) {
    throw new InvalidImageError("O arquivo não é uma imagem válida.");
  }

  let image: Buffer;
  try {
    const decoder = sharp(bytes, { animated: true, limitInputPixels: 40_000_000, failOn: "error" });
    const metadata = await decoder.metadata();
    if (!metadata.pages || metadata.pages === 1) {
      decoder.autoOrient();
    }
    image = await decoder.webp().toBuffer();
  } catch {
    throw new InvalidImageError("Não foi possível decodificar a imagem.");
  }

  const id = randomUUID();
  const url = await storage.upload(image, `${directory}/aq-media-${id}.webp`, "image/webp");
  try {
    await prisma.mediaUpload.create({ data: { id, url, uploaderId } });
  } catch (error) {
    // This fresh, random URL hasn't been published or returned to the caller.
    await storage.delete(url);
    throw error;
  }
  return url;
}

export async function retireOwnedImage(storage: IBlobStorage, uploaderId: string, url: string) {
  const [claim] = await prisma.$queryRaw<
    { retired: boolean }[]
  >`SELECT aquario_retire_owned_image(${url}, ${uploaderId}) AS retired`;
  return claim.retired && storage.delete(url);
}

// A storage outage must not roll back an edit that already committed.
export async function cleanupOwnedImage(storage: IBlobStorage, uploaderId: string, url: string) {
  try {
    await retireOwnedImage(storage, uploaderId, url);
  } catch {
    log.warn("Could not clean up a detached image");
  }
}
